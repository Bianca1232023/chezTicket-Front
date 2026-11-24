package com.chezticket.auth;

import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String senha) {}
    public record CadastroRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 72) String senha,
        @NotBlank @Pattern(regexp = "\\d{11}") String cpf
    ) {}

    public record CadastroOrganizadorRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 72) String senha,
        @NotBlank @Size(max = 160) String razaoSocial,
        @NotBlank @Pattern(regexp = "\\d{14}") String documento
    ) {}

    private final AuthService service;
    private final SecurityContextRepository repository;

    public AuthController(AuthService service, SecurityContextRepository repository) {
        this.service = service;
        this.repository = repository;
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("headerName", token.getHeaderName(), "token", token.getToken());
    }

    @PostMapping("/login")
    public AuthService.Usuario login(@Valid @RequestBody LoginRequest body,
            HttpServletRequest request, HttpServletResponse response) {
        var usuario = service.entrar(body.email(), body.senha());
        iniciarSessao(usuario, request, response);
        return usuario;
    }

    @PostMapping("/cadastro")
    public ResponseEntity<AuthService.Usuario> cadastro(@Valid @RequestBody CadastroRequest body,
            HttpServletRequest request, HttpServletResponse response) {
        var usuario = service.cadastrar(body.nome(), body.email(), body.senha(), body.cpf());
        iniciarSessao(usuario, request, response);
        return ResponseEntity.status(HttpStatus.CREATED).body(usuario);
    }

    @PostMapping("/cadastro-organizador")
    public ResponseEntity<AuthService.Usuario> cadastroOrganizador(
            @Valid @RequestBody CadastroOrganizadorRequest body,
            HttpServletRequest request, HttpServletResponse response) {
        var usuario = service.cadastrarOrganizador(body.nome(), body.email(), body.senha(),
            body.razaoSocial(), body.documento());
        iniciarSessao(usuario, request, response);
        return ResponseEntity.status(HttpStatus.CREATED).body(usuario);
    }

    @GetMapping("/me")
    public AuthService.Usuario me(@AuthenticationPrincipal Long usuarioId) {
        return service.usuario(usuarioId);
    }

    @PostMapping("/logout")
    public Map<String, Boolean> logout(HttpServletRequest request, HttpServletResponse response) {
        new SecurityContextLogoutHandler().logout(
            request, response, SecurityContextHolder.getContext().getAuthentication());
        return Map.of("loggedOut", true);
    }

    private void iniciarSessao(AuthService.Usuario usuario,
            HttpServletRequest request, HttpServletResponse response) {
        // Rotacionar o ID da sessão impede fixation após login/cadastro.
        request.getSession(true);
        request.changeSessionId();
        var autoridades = usuario.papeis().stream()
            .map(papel -> new SimpleGrantedAuthority("ROLE_" + papel))
            .toList();
        var auth = UsernamePasswordAuthenticationToken.authenticated(
            usuario.id(), null, autoridades);
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        repository.saveContext(context, request, response);
    }
}
