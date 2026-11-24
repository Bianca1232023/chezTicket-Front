package com.chezticket.catalogo.evento.application;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** Oculta detalhes de rascunhos dos endpoints publicos relacionados. */
@Service
public class VisibilidadeCatalogoService {
    private final JdbcTemplate jdbc;

    public VisibilidadeCatalogoService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean sessaoVisivel(Long sessaoId, Long usuarioId) {
        return existe("""
                SELECT COUNT(*) FROM sessao s JOIN evento e ON e.id = s.evento_id
                WHERE s.id = ? AND (e.status IN ('PUBLICADO', 'ESGOTADO', 'ENCERRADO')
                    OR e.organizador_id = ?)
                """, sessaoId, usuarioId);
    }

    public boolean ingressoVisivel(Long ingressoId, Long usuarioId) {
        return existe("""
                SELECT COUNT(*) FROM tipo_ingresso ti
                JOIN sessao s ON s.id = ti.sessao_id
                JOIN evento e ON e.id = s.evento_id
                WHERE ti.id = ? AND (e.status IN ('PUBLICADO', 'ESGOTADO', 'ENCERRADO')
                    OR e.organizador_id = ?)
                """, ingressoId, usuarioId);
    }

    public boolean localVisivel(Long localId, Long usuarioId) {
        return existe("""
                SELECT COUNT(*) FROM local l
                WHERE l.id = ? AND (
                    NOT EXISTS (SELECT 1 FROM sessao s WHERE s.local_id = l.id)
                    OR EXISTS (SELECT 1 FROM sessao s JOIN evento e ON e.id = s.evento_id
                        WHERE s.local_id = l.id
                        AND (e.status IN ('PUBLICADO', 'ESGOTADO', 'ENCERRADO')
                            OR e.organizador_id = ?)))
                """, localId, usuarioId);
    }

    public void exigirSessao(Long id, Long usuarioId) {
        if (!sessaoVisivel(id, usuarioId)) ocultar();
    }

    public void exigirIngresso(Long id, Long usuarioId) {
        if (!ingressoVisivel(id, usuarioId)) ocultar();
    }

    public void exigirLocal(Long id, Long usuarioId) {
        if (!localVisivel(id, usuarioId)) ocultar();
    }

    private boolean existe(String sql, Long id, Long usuarioId) {
        Integer count = jdbc.queryForObject(sql, Integer.class, id,
                usuarioId == null ? -1L : usuarioId);
        return count != null && count > 0;
    }

    private static void ocultar() {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Recurso nao encontrado.");
    }
}
