package com.chezticket.email;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.qrcode.QRCodeWriter;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/** Monta o e-mail exclusivamente com os ingressos ja emitidos no MariaDB. */
@Service
public class EmailIngressoSender {
    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm");
    private final JdbcTemplate jdbc;
    private final JavaMailSender smtp;
    private final String remetente;

    private record Pedido(long id, String nome, String email, String status,
                          BigDecimal total, String pagamento) {}
    private record Ingresso(long id, String qr, String tipo, String evento,
                            LocalDateTime inicio) {}
    private record Imagem(String cid, String nomeArquivo, byte[] bytes) {}

    public EmailIngressoSender(JdbcTemplate jdbc, JavaMailSender smtp,
            @Value("${chezticket.email.remetente:}") String remetente) {
        this.jdbc = jdbc;
        this.smtp = smtp;
        this.remetente = remetente;
    }

    public void enviar(Long pedidoId) throws MessagingException, IOException, WriterException {
        if (remetente.isBlank()) {
            throw new IllegalStateException("CHEZTICKET_EMAIL_REMETENTE nao configurado");
        }
        List<Pedido> pedidos = jdbc.query("""
            SELECT p.id, u.nome, u.email, p.status, p.valor_total,
                   pg.status AS pagamento
            FROM pedido p
            JOIN usuario u ON u.id = p.participante_id
            LEFT JOIN pagamento pg ON pg.pedido_id = p.id
            WHERE p.id = ?
            """, (rs, i) -> new Pedido(rs.getLong("id"), rs.getString("nome"),
                rs.getString("email"), rs.getString("status"),
                rs.getBigDecimal("valor_total"), rs.getString("pagamento")), pedidoId);
        if (pedidos.size() != 1) throw new IllegalStateException("Pedido nao encontrado ou duplicado");
        Pedido pedido = pedidos.get(0);
        boolean pago = "PAGO".equals(pedido.status()) && "APROVADO".equals(pedido.pagamento());
        boolean gratuito = "CONCLUIDO".equals(pedido.status())
                && pedido.total().signum() == 0 && pedido.pagamento() == null;
        if (!pago && !gratuito) {
            throw new IllegalStateException("Pedido sem confirmacao para envio de ingresso");
        }
        List<Ingresso> ingressos = jdbc.query("""
            SELECT i.id, i.codigo_qr, ti.nome AS tipo,
                   e.titulo AS evento, s.inicio
              FROM ingresso i
              JOIN tipo_ingresso ti ON ti.id = i.tipo_ingresso_id
              JOIN sessao s ON s.id = ti.sessao_id
              JOIN evento e ON e.id = s.evento_id
             WHERE i.pedido_id = ? AND i.status = 'EMITIDO'
             ORDER BY i.id
            """, (rs, i) -> new Ingresso(rs.getLong("id"), rs.getString("codigo_qr"),
                rs.getString("tipo"), rs.getString("evento"),
                rs.getObject("inicio", LocalDateTime.class)), pedidoId);
        if (ingressos.isEmpty() || ingressos.size() > 50) {
            throw new IllegalStateException("Quantidade de ingressos fora do limite do envio");
        }
        Integer quantidadeEsperada = jdbc.queryForObject("""
            SELECT COALESCE(SUM(quantidade), 0) FROM item_pedido WHERE pedido_id = ?
            """, Integer.class, pedidoId);
        if (quantidadeEsperada == null || quantidadeEsperada != ingressos.size()) {
            throw new IllegalStateException("Emissao de ingressos incompleta");
        }
        if (pedido.email() == null || pedido.email().isBlank()) {
            throw new IllegalStateException("Comprador sem e-mail cadastrado");
        }

        MimeMessage mensagem = smtp.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mensagem, true, "UTF-8");
        helper.setFrom(new InternetAddress(remetente, "chezTicket - Ingressos", "UTF-8"));
        helper.setTo(pedido.email());
        helper.setSubject("Seus ingressos chezTicket - Pedido " + pedido.id());

        StringBuilder html = new StringBuilder("""
            <html><body style="font-family:Arial,sans-serif;color:#20242b">
            <h2>Seus ingressos foram emitidos!</h2>
            <p>Ola, """);
        html.append(escapar(pedido.nome())).append(".</p>")
            .append("<p>Pedido <strong>#").append(pedido.id())
            .append("</strong> confirmado. Apresente o codigo QR na entrada do evento.</p>");
        StringBuilder texto = new StringBuilder("Seus ingressos chezTicket - pedido #")
            .append(pedido.id()).append("\n\n");
        List<Imagem> imagens = new ArrayList<>();
        for (Ingresso ingresso : ingressos) {
            String cid = "qr-ingresso-" + ingresso.id();
            String data = ingresso.inicio() == null ? "Data a confirmar" : DATA.format(ingresso.inicio());
            html.append("<hr/><h3>").append(escapar(ingresso.evento()))
                .append("</h3><p>Tipo: ").append(escapar(ingresso.tipo()))
                .append("<br/>Ingresso #").append(ingresso.id())
                .append("<br/>Data: ").append(escapar(data))
                .append("</p><img width=\"240\" height=\"240\" alt=\"QR Code do ingresso\" src=\"cid:")
                .append(cid).append("\" />");
            texto.append("Evento: ").append(ingresso.evento())
                .append("\nIngresso: ").append(ingresso.tipo())
                .append(" (#").append(ingresso.id()).append(")\n")
                .append("Data: ").append(data).append("\n")
                .append("Codigo QR: ").append(ingresso.qr()).append("\n\n");
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(
                new QRCodeWriter().encode(ingresso.qr(), BarcodeFormat.QR_CODE, 280, 280),
                "PNG", output);
            imagens.add(new Imagem(cid, "ingresso-" + ingresso.id() + ".png", output.toByteArray()));
        }
        html.append("<hr/><p>Guarde estes codigos em seguranca. Eles permitem a entrada no evento.</p>")
            .append("<p>Se precisar, abra o seu perfil no site chezTicket para ver os ingressos.</p>")
            .append("</body></html>");
        helper.setText(texto.toString(), html.toString());
        for (Imagem imagem : imagens) {
            helper.addInline(imagem.cid(), new ByteArrayResource(imagem.bytes()), "image/png");
            helper.addAttachment(imagem.nomeArquivo(), new ByteArrayResource(imagem.bytes()), "image/png");
        }
        smtp.send(mensagem);
    }

    static String escapar(String texto) {
        if (texto == null) return "";
        return texto.replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
    }
}
