package com.chezticket.auth;

import jakarta.servlet.DispatcherType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
            SecurityContextRepository repository) throws Exception {
        http
            .securityContext(ctx -> ctx.securityContextRepository(repository))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            // O webhook valida a assinatura Stripe; não usa cookie de navegador.
            .csrf(csrf -> csrf.ignoringRequestMatchers("/api/stripe/webhook"))
            .authorizeHttpRequests(auth -> auth
                .dispatcherTypeMatchers(DispatcherType.ERROR, DispatcherType.FORWARD).permitAll()
                .requestMatchers(HttpMethod.GET, "/api/eventos/*/rascunho").hasRole("ORGANIZADOR")
                .requestMatchers(HttpMethod.PUT, "/api/eventos/*/rascunho").hasRole("ORGANIZADOR")
                .requestMatchers(HttpMethod.GET,
                    "/api/auth/csrf", "/actuator/health", "/actuator/info",
                    "/api/eventos/**", "/api/categorias/**", "/api/sessoes/**",
                    "/api/locais/**", "/api/tipos-ingresso/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/cadastro",
                    "/api/auth/cadastro-organizador").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/stripe/webhook").permitAll()
                // Publicacao: somente organizador autenticado, dono validado pelo servico.
                .requestMatchers(HttpMethod.POST, "/api/eventos/*/publicacao").hasRole("ORGANIZADOR")
                // Cadastro atomico de RASCUNHO (evento, local, sessao e ingressos).
                .requestMatchers(HttpMethod.POST, "/api/eventos/completo").hasRole("ORGANIZADOR")
                .requestMatchers("/api/reservas/**", "/api/checkout", "/api/checkout/**",
                    "/api/cupons/validacao", "/api/ingressos", "/api/ingressos/reenviar")
                    .hasRole("PARTICIPANTE")
                .requestMatchers("/api/auth/**", "/api/perfil").authenticated()
                // Escrita de catálogo, rota de teste Stripe e outras APIs
                // ainda sem autorização por papel não ficam públicas.
                .requestMatchers("/api/**").denyAll()
                .anyRequest().denyAll()
            )
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((request, response, exception) ->
                    response.sendError(401, "Autenticacao necessaria"))
            )
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .logout(AbstractHttpConfigurer::disable);
        return http.build();
    }
}
