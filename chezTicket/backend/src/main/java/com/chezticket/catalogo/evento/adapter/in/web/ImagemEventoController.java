package com.chezticket.catalogo.evento.adapter.in.web;

import java.util.Objects;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/eventos")
public class ImagemEventoController {
    private final JdbcTemplate jdbc;
    public ImagemEventoController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping("/{id}/imagens/{tipo}")
    public ResponseEntity<byte[]> imagem(@PathVariable Long id, @PathVariable String tipo,
            @AuthenticationPrincipal Long usuarioId) {
        String codigo = switch (tipo) {
            case "capa" -> "CAPA";
            case "divulgacao" -> "DIVULGACAO";
            default -> throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        };
        var dados = jdbc.query("""
                SELECT e.organizador_id, e.status, m.mime, m.conteudo
                FROM evento e JOIN evento_midia m ON m.evento_id = e.id
                WHERE e.id = ? AND m.tipo = ?
                """, (rs, row) -> new Imagem(rs.getLong("organizador_id"),
                rs.getString("status"), rs.getString("mime"), rs.getBytes("conteudo")), id, codigo);
        if (dados.size() != 1) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Imagem img = dados.get(0);
        boolean visivel = "PUBLICADO".equals(img.status)
                || "ESGOTADO".equals(img.status)
                || "ENCERRADO".equals(img.status)
                || (usuarioId != null && Objects.equals(img.organizadorId, usuarioId));
        if (!visivel) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(img.mime))
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.noStore())
                .body(img.bytes);
    }

    private record Imagem(Long organizadorId, String status, String mime, byte[] bytes) {}
}
