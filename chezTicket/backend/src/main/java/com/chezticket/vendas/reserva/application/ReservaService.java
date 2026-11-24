package com.chezticket.vendas.reserva.application;

import com.chezticket.vendas.reserva.application.port.in.CancelarReservaUseCase;
import com.chezticket.vendas.reserva.application.port.in.ConsultarReservasUseCase;
import com.chezticket.vendas.reserva.application.port.in.ExpirarReservasVencidasUseCase;
import com.chezticket.vendas.reserva.application.port.in.ItemReservaComando;
import com.chezticket.vendas.reserva.application.port.in.NovaReserva;
import com.chezticket.vendas.reserva.application.port.in.ReservarIngressosUseCase;
import com.chezticket.vendas.reserva.application.port.out.GerenciarEstoqueDeIngressosPort;
import com.chezticket.vendas.reserva.application.port.out.ReservaRepositorio;
import com.chezticket.vendas.reserva.application.port.out.VerificarParticipantePort;
import com.chezticket.vendas.reserva.domain.ItemReserva;
import com.chezticket.vendas.reserva.domain.Reserva;
import com.chezticket.vendas.reserva.domain.exception.ReservaInvalidaException;
import com.chezticket.vendas.reserva.domain.exception.ReservaNaoEncontradaException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;

@Service
@Transactional
public class ReservaService implements
        ReservarIngressosUseCase,
        ConsultarReservasUseCase,
        CancelarReservaUseCase,
        ExpirarReservasVencidasUseCase {

    /** Tempo que o participante tem para concluir a compra antes do estoque voltar a ficar livre. */
    static final Duration DURACAO_DA_RESERVA = Duration.ofMinutes(10);

    private final ReservaRepositorio repositorio;
    private final VerificarParticipantePort verificarParticipante;
    private final GerenciarEstoqueDeIngressosPort estoque;
    
    private final JdbcTemplate jdbc;

    public ReservaService(
            ReservaRepositorio repositorio,
            VerificarParticipantePort verificarParticipante,
            GerenciarEstoqueDeIngressosPort estoque,
            JdbcTemplate jdbc
    ) {
        this.repositorio = repositorio;
        this.verificarParticipante = verificarParticipante;
        this.estoque = estoque;
        this.jdbc = jdbc;
    }

    @Override
    public Reserva reservar(NovaReserva comando) {
        if (!verificarParticipante.participanteExiste(comando.participanteId())) {
            throw new ReservaInvalidaException("Participante inexistente: " + comando.participanteId() + ".");
        }
        if (comando.itens() == null || comando.itens().isEmpty()) {
            throw new ReservaInvalidaException("A reserva deve ter ao menos um item.");
        }

        List<ItemReserva> itens = comando.itens().stream()
                .map(item -> new ItemReserva(item.tipoIngressoId(), item.quantidade()))
                .toList();
        for (ItemReserva item : itens) {
            validarPeriodoVenda(item.tipoIngressoId());
            estoque.reservarUnidades(item.tipoIngressoId(), item.quantidade());
        }

        Reserva reserva = Reserva.criar(comando.participanteId(), itens, DURACAO_DA_RESERVA);
        return repositorio.salvar(reserva);
    }

    // O servidor sempre revalida. Alterar o relogio do navegador nao libera vendas.
    private void validarPeriodoVenda(Long tipoId) {
        Integer disponivel = jdbc.queryForObject("""
            SELECT COUNT(*) FROM tipo_ingresso ti
            JOIN sessao se ON se.id = ti.sessao_id
            JOIN evento ev ON ev.id = se.evento_id
            WHERE ti.id = ?
              AND ev.status = 'PUBLICADO'
              AND se.status = 'AGENDADA'
              AND se.inicio > CURRENT_TIMESTAMP(6)
              AND (ti.inicio_vendas IS NULL OR ti.inicio_vendas <= CURRENT_DATE())
              AND (ti.fim_vendas IS NULL OR ti.fim_vendas >= CURRENT_DATE())
            """, Integer.class, tipoId);
        if (disponivel == null || disponivel != 1) {
            throw new ReservaInvalidaException(
                "Ingresso indisponivel: verifique a publicacao e as datas de venda.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Reserva buscarPorId(Long id) {
        return carregar(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Reserva> listarPorParticipante(Long participanteId) {
        return repositorio.listarPorParticipante(participanteId);
    }

    @Override
    public Reserva cancelar(Long id) {

        bloquearReserva(id);

        if (existePagamentoPendente(id)) {
            throw new ReservaInvalidaException(
                "Existe um pagamento pendente. " +
                "É necessário resolver ou cancelar " +
                "o checkout antes de liberar a reserva."
            );
        }

        Reserva reserva = carregar(id);

        reserva.cancelar();

        liberarEstoqueDaReserva(reserva);

        return repositorio.salvar(reserva);
    }

    @Override
    public int expirarVencidas() {

        List<Reserva> vencidas =
            repositorio.listarAtivasExpiradasAte(
                LocalDateTime.now()
            );

        int totalExpiradas = 0;

        for (Reserva reserva : vencidas) {

            // Bloqueia a linha antes de tomar a decisão.
            bloquearReserva(reserva.id());

            // Uma transação pode ter prorrogado a reserva
            // depois que ela entrou na lista de vencidas.
            if (!reservaVencidaNoBanco(reserva.id())) {
                continue;
            }

            // Não libera ingressos enquanto existir
            // pagamento pendente de resolução.
            if (existePagamentoPendente(reserva.id())) {
                continue;
            }

            // Sem pagamento pendente: fluxo original.
            reserva.expirar();

            liberarEstoqueDaReserva(reserva);

            repositorio.salvar(reserva);

            totalExpiradas++;
        }

        return totalExpiradas;
    }

    private void liberarEstoqueDaReserva(Reserva reserva) {
        for (ItemReserva item : reserva.itens()) {
            estoque.liberarUnidades(item.tipoIngressoId(), item.quantidade());
        }
    }

    private Reserva carregar(Long id) {
        return repositorio.buscarPorId(id)
                .orElseThrow(() -> new ReservaNaoEncontradaException(id));
    }

    // Bloqueia a linha enquanto a reserva é verificada.
    // Evita uma corrida com a criação do pedido.
    private void bloquearReserva(Long reservaId) {
        jdbc.queryForObject(
            "SELECT id FROM reserva WHERE id = ? FOR UPDATE",
            Long.class,
            reservaId
        );
    }

    // Confere novamente se a reserva realmente venceu.
    // A data pode ter sido prorrogada depois da busca inicial.
    private boolean reservaVencidaNoBanco(Long reservaId) {

        Integer quantidade = jdbc.queryForObject("""
            SELECT COUNT(*)
            FROM reserva
            WHERE id = ?
                AND status = 'ATIVA'
                AND expira_em <= ?
            """,
            Integer.class,
            reservaId,
            LocalDateTime.now()
        );

        return quantidade != null && quantidade > 0;
    }

    // Verifica se existe um pedido aguardando pagamento.
    private boolean existePagamentoPendente(Long reservaId) {

        Integer quantidade = jdbc.queryForObject("""
            SELECT COUNT(*)
            FROM pedido p
            JOIN pagamento pg
                ON pg.pedido_id = p.id
            WHERE p.reserva_id = ?
                AND p.status = 'AGUARDANDO_PAGAMENTO'
                AND pg.status = 'PENDENTE'
            """,
            Integer.class,
            reservaId
        );

    return quantidade != null && quantidade > 0;
    }
}
