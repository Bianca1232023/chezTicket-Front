package com.chezticket.auth;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    // Um usuario pode ter mais de um papel no modelo do banco.
    // CPF e nulo para quem nao possui o perfil participante.
    public record Usuario(Long id, String nome, String email, String cpf, List<String> papeis) {}
    private record Conta(Usuario usuario, String senhaHash) {}

    private static final String CONSULTA_PERFIS = """
        SELECT u.id, u.nome, u.email, u.senha_hash, p.cpf,
               (p.usuario_id IS NOT NULL) AS participante,
               (o.usuario_id IS NOT NULL) AS organizador,
               (a.usuario_id IS NOT NULL) AS administrador
          FROM usuario u
          LEFT JOIN participante p ON p.usuario_id = u.id
          LEFT JOIN organizador o ON o.usuario_id = u.id
          LEFT JOIN administrador a ON a.usuario_id = u.id
         WHERE u.%s = ? AND u.status = 'ATIVO'
        """;

    private static final RowMapper<Conta> CONTA_MAPPER = (rs, row) -> new Conta(
        new Usuario(rs.getLong("id"), rs.getString("nome"), rs.getString("email"),
            rs.getString("cpf"), lerPapeis(rs)), rs.getString("senha_hash"));

    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;

    public AuthService(JdbcTemplate jdbc, PasswordEncoder encoder) {
        this.jdbc = jdbc;
        this.encoder = encoder;
    }

    public Usuario entrar(String email, String senha) {
        String emailNormalizado = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        List<Conta> contas = jdbc.query(CONSULTA_PERFIS.formatted("email"),
            CONTA_MAPPER, emailNormalizado);
        if (contas.size() != 1 || !encoder.matches(senha, contas.get(0).senhaHash())
                || contas.get(0).usuario().papeis().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha invalidos");
        }
        return contas.get(0).usuario();
    }

    @Transactional
    public Usuario cadastrar(String nome, String email, String senha, String cpf) {
        if (cpf == null || !cpf.matches("\\d{11}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF deve conter 11 digitos");
        }
        try {
            Usuario novo = criarUsuario(nome, email, senha);
            jdbc.update("INSERT INTO participante (usuario_id, cpf) VALUES (?, ?)", novo.id(), cpf);
            return new Usuario(novo.id(), novo.nome(), novo.email(), cpf, List.of("PARTICIPANTE"));
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail ou CPF ja cadastrado");
        }
    }

    /** Cadastro separado: o comprador nunca pode informar um papel no login. */
    @Transactional
    public Usuario cadastrarOrganizador(String nome, String email, String senha,
            String razaoSocial, String documento) {
        if (razaoSocial == null || razaoSocial.isBlank() || razaoSocial.length() > 160
                || documento == null || !documento.matches("\\d{14}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Informe razao social e CNPJ com 14 digitos");
        }
        try {
            Usuario novo = criarUsuario(nome, email, senha);
            jdbc.update("""
                INSERT INTO organizador (usuario_id, razao_social, documento)
                VALUES (?, ?, ?)
                """, novo.id(), razaoSocial.trim(), documento);
            return new Usuario(novo.id(), novo.nome(), novo.email(), null,
                List.of("ORGANIZADOR"));
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "E-mail ou documento de organizador ja cadastrado");
        }
    }

    public Usuario usuario(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessao invalida");
        }
        List<Conta> contas = jdbc.query(CONSULTA_PERFIS.formatted("id"), CONTA_MAPPER, id);
        if (contas.size() != 1 || contas.get(0).usuario().papeis().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessao invalida");
        }
        return contas.get(0).usuario();
    }

    private Usuario criarUsuario(String nome, String email, String senha) {
        String emailNormalizado = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        String nomeNormalizado = nome == null ? "" : nome.trim();
        if (nomeNormalizado.isBlank() || nomeNormalizado.length() > 120
                || emailNormalizado.isBlank() || emailNormalizado.length() > 180
                || senha == null || senha.length() < 8 || senha.length() > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados de cadastro invalidos");
        }
        KeyHolder holder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                "INSERT INTO usuario (nome, email, senha_hash) VALUES (?, ?, ?)",
                Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, nomeNormalizado);
            ps.setString(2, emailNormalizado);
            ps.setString(3, encoder.encode(senha));
            return ps;
        }, holder);
        Number key = holder.getKey();
        if (key == null) throw new IllegalStateException("Cadastro sem identificador");
        return new Usuario(key.longValue(), nomeNormalizado, emailNormalizado, null, List.of());
    }

    private static List<String> lerPapeis(ResultSet rs) throws SQLException {
        List<String> papeis = new ArrayList<>(3);
        if (rs.getBoolean("participante")) papeis.add("PARTICIPANTE");
        if (rs.getBoolean("organizador")) papeis.add("ORGANIZADOR");
        if (rs.getBoolean("administrador")) papeis.add("ADMINISTRADOR");
        return List.copyOf(papeis);
    }
}
