package com.chezticket.cupom;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** Cupons globais: descontos sobre o subtotal, nunca sobre as taxas. */
@Service
public class CupomService {

    private final JdbcTemplate jdbc;

    public CupomService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record CupomValidado(String codigo, String tipo, BigDecimal valor,
            BigDecimal percentualDesconto, LocalDate validoAte) {}

    public record CupomAplicado(Long cupomId, BigDecimal desconto) {}

    public CupomValidado validar(Long eventoId, String codigo) {
        if (eventoId == null || eventoId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evento invalido");
        }
        Integer eventoPublicado = jdbc.queryForObject(
            "SELECT COUNT(*) FROM evento WHERE id = ? AND status = 'PUBLICADO'",
            Integer.class, eventoId);
        if (eventoPublicado == null || eventoPublicado == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento nao disponivel");
        }
        Cupom cupom = buscar(normalizar(codigo), false);
        conferirDisponibilidade(cupom);
        verificarEvento(cupom, eventoId);
        return new CupomValidado(cupom.codigo(), cupom.tipo(), cupom.valor(),
            "PERCENTUAL".equals(cupom.tipo()) ? cupom.valor() : BigDecimal.ZERO,
            cupom.validade());
    }

    /** Chamado DENTRO da transacao de criacao do pedido, sob bloqueio da reserva. */
    public CupomAplicado aplicarAoPedido(String codigo, BigDecimal subtotal,
            List<Long> eventosDaReserva) {
        if (codigo == null || codigo.isBlank()) {
            return new CupomAplicado(null, BigDecimal.ZERO);
        }
        Cupom cupom = buscar(normalizar(codigo), true);
        conferirDisponibilidade(cupom);
        if (cupom.eventoId() != null && (eventosDaReserva == null
                || eventosDaReserva.isEmpty()
                || eventosDaReserva.stream().anyMatch(id -> !cupom.eventoId().equals(id)))) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Este cupom so pode ser usado no evento de origem");
        }
        if (subtotal == null || subtotal.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "O pedido nao possui valor elegivel para o cupom");
        }
        BigDecimal desconto = "PERCENTUAL".equals(cupom.tipo())
            ? subtotal.multiply(cupom.valor())
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP)
            : cupom.valor();
        desconto = desconto.min(subtotal).setScale(2, RoundingMode.HALF_UP);
        // Reserva uma utilizacao do cupom nesta mesma transacao.
        // O lock FOR UPDATE permite comparar o limite sem leituras antigas
        // (isolamento REPEATABLE READ do MariaDB).
        int atualizado = jdbc.update("""
            UPDATE cupom SET usos = usos + 1
            WHERE id = ? AND (limite_usos = 0 OR usos < limite_usos)
            """, cupom.id());
        if (atualizado != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "O cupom atingiu o limite de utilizacoes");
        }
        return new CupomAplicado(cupom.id(), desconto);
    }

    private void verificarEvento(Cupom cupom, Long eventoId) {
        if (cupom.eventoId() != null && !cupom.eventoId().equals(eventoId)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Este cupom nao e valido para o evento selecionado");
        }
    }

    private void conferirDisponibilidade(Cupom cupom) {
        if (cupom.validade() != null && cupom.validade().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Cupom expirado");
        }
        if (cupom.valor().signum() <= 0
                || ("PERCENTUAL".equals(cupom.tipo())
                    && cupom.valor().compareTo(new BigDecimal("100")) > 0)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Valor do cupom invalido");
        }
        // Zero no esquema existente significa sem limite de utilizacoes.
        // 'usos' inclui pedidos pagos e utilizacoes temporariamente
        // reservadas em Checkouts pendentes; expiracoes devolvem a vaga.
        if (cupom.limiteUsos() > 0 && cupom.usos() >= cupom.limiteUsos()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "O cupom atingiu o limite de utilizacoes");
        }
    }

    private Cupom buscar(String codigo, boolean bloquear) {
        String sql = """
            SELECT id, codigo, tipo, valor, validade, limite_usos, usos, evento_id
            FROM cupom WHERE codigo = ?
            """ + (bloquear ? " FOR UPDATE" : "");
        List<Cupom> lista = jdbc.query(sql, (rs, i) -> {
            Date data = rs.getDate("validade");
            return new Cupom(rs.getLong("id"), rs.getString("codigo"),
                rs.getString("tipo"), rs.getBigDecimal("valor"),
                data == null ? null : data.toLocalDate(),
                rs.getInt("limite_usos"), rs.getInt("usos"),
                rs.getObject("evento_id", Long.class));
        }, codigo);
        if (lista.size() != 1) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Cupom nao encontrado");
        }
        return lista.get(0);
    }

    private String normalizar(String codigo) {
        if (codigo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um cupom");
        }
        String normalizado = codigo.trim().toUpperCase(Locale.ROOT);
        if (!normalizado.matches("[A-Z0-9]{4,40}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Use de 4 a 40 letras ou numeros no codigo do cupom");
        }
        return normalizado;
    }

    private record Cupom(Long id, String codigo, String tipo,
            BigDecimal valor, LocalDate validade, int limiteUsos, int usos,
            Long eventoId) {}
}
