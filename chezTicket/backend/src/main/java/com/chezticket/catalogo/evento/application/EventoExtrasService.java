package com.chezticket.catalogo.evento.application;

import com.chezticket.catalogo.evento.adapter.in.web.dto.EventoCompletoRequest;
import java.io.IOException;
import java.net.URI;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EventoExtrasService {
    private static final long MAX_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> REDES = Set.of("instagram", "facebook", "x", "linkedin");
    private final JdbcTemplate jdbc;

    public EventoExtrasService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    /** Valida dados e arquivos antes de criar o rascunho; transacao e mantida no chamador. */
    public void validar(EventoCompletoRequest dados, MultipartFile capa, MultipartFile divulgacao) {
        if (dados.tags() != null) {
            if (dados.tags().size() > 10) erro("No maximo 10 tags por evento.");
            for (String tag : dados.tags()) {
                if (tag == null || tag.isBlank() || tag.length() > 40
                        || !tag.matches("[\\p{L}\\p{N} _-]+")) {
                    erro("Tag invalida (ate 40 caracteres, letras, numeros, espaco, _ ou -).");
                }
            }
        }
        if (dados.redesSociais() != null) {
            if (dados.redesSociais().size() > REDES.size()) erro("Rede social nao suportada.");
            for (var entry : dados.redesSociais().entrySet()) {
                if (!REDES.contains(entry.getKey())) erro("Rede social nao suportada.");
                String url = entry.getValue();
                if (url == null || url.isBlank()) continue;
                if (url.length() > 500 || url.chars().anyMatch(Character::isISOControl)) {
                    erro("URL de rede social invalida.");
                }
                try {
                    URI uri = URI.create(url);
                    if (!"https".equalsIgnoreCase(uri.getScheme())
                            || uri.getHost() == null || uri.getHost().isBlank()
                            || uri.getRawUserInfo() != null) {
                        erro("Use links HTTPS validos para as redes sociais.");
                    }
                } catch (IllegalArgumentException ex) {
                    erro("URL de rede social invalida.");
                }
            }
        }
        verificarImagem(capa);
        verificarImagem(divulgacao);
    }

    public void salvar(Long eventoId, EventoCompletoRequest dados,
            MultipartFile capa, MultipartFile divulgacao) {
        if (dados.tags() != null) {
            Set<String> distintas = new LinkedHashSet<>();
            for (String tag : dados.tags()) distintas.add(tag.trim());
            for (String tag : distintas) {
                jdbc.update("INSERT INTO evento_tag (evento_id, tag) VALUES (?, ?)", eventoId, tag);
            }
        }
        if (dados.redesSociais() != null) {
            for (var entry : dados.redesSociais().entrySet()) {
                if (entry.getValue() != null && !entry.getValue().isBlank()) {
                    jdbc.update("INSERT INTO evento_rede_social (evento_id, rede, url) VALUES (?, ?, ?)",
                            eventoId, entry.getKey(), entry.getValue().trim());
                }
            }
        }
        if (capa != null && !capa.isEmpty()) {
            salvarImagem(eventoId, "CAPA", capa);
            jdbc.update("UPDATE evento SET imagem_capa = ? WHERE id = ?",
                    "/api/eventos/" + eventoId + "/imagens/capa", eventoId);
        }
        if (divulgacao != null && !divulgacao.isEmpty()) {
            salvarImagem(eventoId, "DIVULGACAO", divulgacao);
        }
    }

    public List<String> tags(Long eventoId) {
        return jdbc.queryForList("SELECT tag FROM evento_tag WHERE evento_id = ? ORDER BY tag",
                String.class, eventoId);
    }

    public Map<String, String> redesSociais(Long eventoId) {
        return jdbc.query("SELECT rede, url FROM evento_rede_social WHERE evento_id = ?",
                rs -> {
                    Map<String, String> result = new LinkedHashMap<>();
                    while (rs.next()) result.put(rs.getString("rede"), rs.getString("url"));
                    return result;
                }, eventoId);
    }

    public String imagemDivulgacao(Long eventoId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM evento_midia WHERE evento_id = ? AND tipo = 'DIVULGACAO'",
                Integer.class, eventoId);
        return count != null && count > 0 ? "/api/eventos/" + eventoId + "/imagens/divulgacao" : null;
    }

    private void salvarImagem(Long id, String tipo, MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            String mime = identificarMime(bytes);
            jdbc.update("INSERT INTO evento_midia (evento_id, tipo, mime, conteudo) VALUES (?, ?, ?, ?)",
                    id, tipo, mime, bytes);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Nao foi possivel ler a imagem enviada.", ex);
        }
    }

    private void verificarImagem(MultipartFile file) {
        if (file == null || file.isEmpty()) return;
        if (file.getSize() <= 0 || file.getSize() > MAX_BYTES) {
            erro("Cada imagem deve ter no maximo 5 MB.");
        }
        try {
            String mime = identificarMime(file.getBytes());
            String declarado = file.getContentType();
            if (declarado != null && !declarado.isBlank()
                    && !"application/octet-stream".equalsIgnoreCase(declarado)
                    && !mime.equalsIgnoreCase(declarado)) {
                erro("O formato declarado e o conteudo da imagem nao coincidem.");
            }
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Nao foi possivel ler a imagem enviada.", ex);
        }
    }

    private String identificarMime(byte[] bytes) {
        if (bytes.length >= 8 && Arrays.equals(Arrays.copyOf(bytes, 8),
                new byte[]{(byte)137,80,78,71,13,10,26,10})) return "image/png";
        if (bytes.length >= 3 && (bytes[0] & 0xff) == 0xff
                && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff) return "image/jpeg";
        if (bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I'
                && bytes[2] == 'F' && bytes[3] == 'F' && bytes[8] == 'W'
                && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') return "image/webp";
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Formato de imagem invalido. Use JPG, PNG ou WEBP.");
    }

    private static void erro(String message) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
