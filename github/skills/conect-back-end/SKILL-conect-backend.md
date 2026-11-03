---
name: cheezticket-backend-frontend-integration
description: Integra o frontend existente do CheezTicket com a API backend Spring Boot, criando hooks React, camada HTTP, serviços, tipos e estados de interface sem alterar o design existente.
---

# Skill — Integração Frontend + Backend | CheezTicket

## Objetivo

Conectar o frontend atual do CheezTicket ao backend existente, implementando a camada de comunicação com a API e os hooks necessários para que as telas consumam dados reais.

A integração deve respeitar integralmente a arquitetura, o design e os padrões já existentes no repositório. **Não recrie o frontend, não redesenhe telas e não substitua componentes visuais funcionais.caso possua dado falso em algum componente remova-o**

O backend conhecido é Spring Boot e possui funcionalidades/domínios relacionados a:

- Categorias
- Eventos
- Locais
- Sessões
- Tipos de ingresso
- Reservas

Esses nomes são pistas para a inspeção inicial, não autorização para inventar rotas, métodos HTTP, campos ou regras de negócio. A implementação deve ser baseada no código real do backend.

## Regra obrigatória de execução: analisar, planejar e aguardar aprovação

A execução deve ocorrer em duas fases.

### Fase 1 — Auditoria e plano (não alterar arquivos)

Antes de implementar:

1. Identifique a raiz do frontend e a raiz do backend.
2. Leia os `package.json`, arquivos de configuração, estrutura de pastas e documentação.
3. Identifique a stack real do frontend. Não presuma Next.js, Vite, React Query, Axios ou qualquer biblioteca sem verificar as dependências.
4. Inspecione o backend Spring Boot:
   - `Controller` / `RestController`
   - `RequestMapping`, `GetMapping`, `PostMapping`, `PutMapping`, `PatchMapping`, `DeleteMapping`
   - DTOs de entrada e saída
   - Entidades e relacionamentos
   - Services e Repositories
   - Validações
   - Tratamento global de exceções
   - Configuração CORS
   - Segurança e autenticação
   - Paginação, filtros e ordenação
5. Monte um inventário de endpoints reais. Para cada endpoint, registre método, caminho, parâmetros, corpo esperado, resposta e erros conhecidos.
6. Inspecione todas as telas do frontend e identifique quais precisam de dados da API.
7. Verifique os hooks, serviços, componentes e tipos que já existem para evitar duplicações.
8. Apresente um plano com:
   - Diagnóstico da arquitetura atual.
   - Mapeamento tela → endpoint.
   - Hooks que serão criados ou adaptados.
   - Serviços e tipos necessários.
   - Arquivos que serão criados/alterados.
   - Riscos, dúvidas e dependências.
   - Estratégia de testes.
9. **Pare e aguarde aprovação explícita do usuário.** Não edite arquivos durante esta fase.

### Fase 2 — Implementação (somente após aprovação)

Implemente o plano aprovado. Se durante a implementação descobrir divergências relevantes, pare, explique o problema e solicite nova aprovação antes de ampliar o escopo.

## Princípios inegociáveis

- Backend é a fonte da verdade para rotas, contratos, validações e regras de negócio.
- Não invente endpoints nem propriedades de DTO.
- Não faça chamadas HTTP diretamente dentro de páginas ou componentes visuais.
- Não coloque regras de negócio dentro de componentes de apresentação.
- Não duplique lógica de requisição em múltiplas telas.
- Não altere o layout, responsividade, tipografia, ícones ou identidade visual.
- Preserve as variáveis SCSS existentes na pasta `style/`. Não replique valores HEX nem crie uma segunda paleta.
- Preserve nomes e convenções existentes sempre que forem consistentes.
- Não remova funcionalidades existentes para facilitar a integração.
- Não use dados mockados em produção. Mocks só podem permanecer em testes ou em desenvolvimento, claramente identificados.
- Não silencie erros com `catch` vazio nem retorne arrays vazios como fallback para falhas da API.
- Não armazene segredos no código do frontend.

## Arquitetura de integração desejada

Adapte os caminhos à estrutura real do projeto. Não force a criação de uma nova arquitetura se o frontend já possuir uma equivalente.

Uma organização de referência:

```text
src/
  services/
    api/
      http-client.ts
      api-error.ts
      endpoints.ts
    categories/
      category.service.ts
    events/
      event.service.ts
    locations/
      location.service.ts
    sessions/
      session.service.ts
    tickets/
      ticket-type.service.ts
    reservations/
      reservation.service.ts

  hooks/
    categories/
      use-categories.ts
      use-category.ts
    events/
      use-events.ts
      use-event.ts
      use-create-event.ts
      use-update-event.ts
    locations/
      use-locations.ts
    sessions/
      use-sessions.ts
    tickets/
      use-ticket-types.ts
    reservations/
      use-reservations.ts
      use-create-reservation.ts

  types/
    api/
      common.types.ts
      category.types.ts
      event.types.ts
      location.types.ts
      session.types.ts
      ticket-type.types.ts
      reservation.types.ts
```

A estrutura acima é ilustrativa. Se o projeto utiliza `features/`, `modules/`, `lib/`, `api/` ou outra convenção, mantenha a convenção existente.

### 1. Cliente HTTP centralizado

Crie ou adapte um único cliente HTTP para:

- Definir a URL base por variável de ambiente.
- Centralizar headers.
- Serializar parâmetros de query.
- Serializar corpos JSON quando aplicável.
- Tratar respostas sem conteúdo (`204 No Content`).
- Tratar respostas JSON e texto.
- Normalizar erros HTTP e de rede.
- Preservar o status HTTP e detalhes úteis para a interface.
- Aplicar timeout somente se isso seguir os padrões do projeto.
- Permitir cancelamento de requisições quando suportado pela stack.

Use a biblioteca HTTP já instalada. Se não houver uma, escolha a solução mais simples compatível com o projeto (por exemplo, `fetch`) e justifique no plano.

Não crie múltiplos clientes HTTP independentes.

### 2. Variáveis de ambiente

Use o padrão correspondente à ferramenta real do frontend:

- Vite: variáveis públicas com prefixo `VITE_`.
- Next.js: variáveis públicas com prefixo `NEXT_PUBLIC_`.
- Outra stack: seguir a documentação e convenção do projeto.

Exemplo conceitual:

```env
# Exemplo: adaptar o nome ao padrão da stack encontrada.
VITE_API_BASE_URL=http://localhost:8080
```

Crie ou atualize o arquivo de exemplo de ambiente (`.env.example` ou equivalente), sem incluir credenciais reais. Nunca exponha senhas, tokens privados ou chaves secretas em variáveis públicas.

### 3. Serviços por domínio

Cada serviço deve representar operações reais disponíveis no backend.

Exemplo conceitual (não copiar rotas sem verificar o backend):

```ts
export const eventService = {
  list: (params?: EventListParams) =>
    apiClient.get<EventResponse[]>('/rota-real-confirmada', { params }),

  getById: (id: number | string) =>
    apiClient.get<EventResponse>(`/rota-real-confirmada/${id}`),
};
```

Regras:

- Serviços conhecem HTTP e contratos da API.
- Serviços não conhecem componentes React.
- Serviços não controlam toast, modal, navegação ou estado visual.
- Tipos devem refletir os DTOs reais.
- Se o backend retornar um formato diferente do modelo usado pela UI, crie uma função explícita de transformação/mapper. Não force o DTO a fingir que é o modelo da tela.

### 4. Hooks React obrigatórios

Crie hooks para encapsular o consumo dos serviços e fornecer estados previsíveis às telas.

Os hooks devem ser criados para os fluxos realmente suportados pelo backend e utilizados pelo frontend. Não crie operações CRUD que não existam na API.

Para consultas, considere hooks como:

- `useCategories`
- `useCategory`
- `useEvents`
- `useEvent`
- `useLocations`
- `useSessions`
- `useTicketTypes`
- `useReservations`

Para mutações, conforme os endpoints existentes:

- `useCreateEvent`
- `useUpdateEvent`
- `useDeleteEvent`
- `useCreateReservation`
- `useCancelReservation`

Os nomes são sugestões; siga o padrão já adotado no projeto.

Cada hook de consulta deve expor, conforme necessário:

- `data`
- `isLoading` ou `isPending`
- `isError`
- `error`
- `refetch` ou mecanismo equivalente

Cada hook de mutação deve expor, conforme necessário:

- `mutate` / `mutateAsync` ou equivalente
- `isPending`
- `isSuccess`
- `isError`
- `error`
- `reset`

#### Biblioteca de estado de servidor

1. Se TanStack Query/React Query já estiver instalado, utilize-o e siga a configuração existente.
2. Se outra biblioteca de estado de servidor já estiver instalada, avalie e reutilize-a.
3. Se não existir biblioteca, não adicione uma dependência pesada sem necessidade. Implemente hooks com `useState`, `useEffect`, `useCallback` e `AbortController`, seguindo o padrão da versão do React instalada.
4. Não implemente um cache artesanal complexo se a aplicação não precisar dele.

#### Comportamento dos hooks

- Evite requisições duplicadas.
- Cancele consultas obsoletas quando apropriado.
- Trate mudanças de parâmetros e IDs.
- Não dispare consulta com identificador inválido.
- Diferencie carregamento inicial de atualização, se a biblioteca utilizada permitir.
- Para mutações, invalide ou atualize os dados relacionados após sucesso.
- Não esconda erros.
- Não acople hooks a uma página específica.
- Mantenha os hooks reutilizáveis e tipados.

### 5. Mapeamento dos contratos

Para cada domínio, compare:

| Camada | Responsabilidade |
|---|---|
| DTO do backend | Contrato real recebido/enviado pela API |
| Tipo API do frontend | Representação fiel do DTO |
| Mapper | Conversão entre DTO e modelo da interface, quando necessária |
| Service | Requisição HTTP |
| Hook | Estado e ciclo de vida da operação |
| Componente/página | Exibição e interação |

Não misture os campos de entidades com os campos de DTOs sem verificar os mapeamentos feitos pelo backend.

### 6. Integração das telas

Associe cada tela existente às operações correspondentes. Verifique especialmente os fluxos:

- Explorar/listar eventos.
- Detalhes de um evento.
- Criar e editar evento.
- Gerenciar local, sessões e tipos de ingresso.
- Processo de compra/reserva.
- Visualizar reservas/ingressos do usuário.
- Categorias e filtros.
- Perfil e dados do usuário, somente se houver endpoints correspondentes.

Esses fluxos são uma lista de inspeção, não uma afirmação de que todos os endpoints existem.

Em cada tela:

1. Identifique os dados atualmente estáticos ou mockados.
2. Substitua somente os dados que devem vir da API.
3. Preserve o contrato visual dos componentes sempre que possível.
4. Conecte ações de formulário aos hooks de mutação.
5. Exiba estados de carregamento, vazio, erro e sucesso.
6. Preserve validações do frontend, sem substituir as validações definitivas do backend.
7. Atualize a interface após mutações bem-sucedidas.

### 7. Estados visuais

Reutilize os componentes existentes para:

- Loading/skeleton.
- Estado vazio.
- Mensagem de erro.
- Feedback de sucesso.
- Botões desabilitados durante envio.
- Erros de validação por campo.

Se esses componentes não existirem, proponha sua criação usando os estilos e tokens já existentes. Não crie uma nova linguagem visual.

Mensagens para o usuário devem ser claras e em português. Detalhes técnicos podem ser registrados no console em desenvolvimento ou no mecanismo de logging já existente, sem expor dados sensíveis.

### 8. Autenticação e segurança

Inspecione a configuração real de segurança do backend antes de implementar autenticação.

**Atenção:** o uso de um header como `X-Usuario-Id` não comprova autenticação. Se o backend apenas confia nesse valor enviado pelo cliente, isso não deve ser apresentado como autenticação segura.

- Não invente login, JWT, refresh token ou sessão.
- Não simule usuário autenticado.
- Não salve credenciais em `localStorage` sem uma decisão arquitetural explícita e análise de segurança.
- Se o backend não tiver autenticação implementada, documente a limitação e sinalize quais operações ficam sem proteção real.
- Se houver JWT ou cookie de sessão, implemente conforme o mecanismo existente e as configurações de segurança do servidor.
- Não envie identificadores de usuário arbitrários para contornar autorização.

### 9. CORS e comunicação entre ambientes

Verifique se o backend permite a origem do frontend. Não resolva CORS desabilitando segurança indiscriminadamente.

Documente:

- URL local do backend.
- URL local do frontend.
- Variável de ambiente usada.
- Configuração CORS necessária.
- Configuração de proxy, se já existir.
- Diferença entre desenvolvimento e produção.

Não fixe `localhost` no código de produção.

### 10. Testes e validação

Após a implementação:

1. Execute os scripts disponíveis no `package.json`.
2. Execute lint e typecheck, se configurados.
3. Execute testes existentes.
4. Adicione testes para o cliente HTTP, serviços e hooks de maior impacto, usando as ferramentas já instaladas.
5. Verifique os fluxos de sucesso, erro, carregamento e resposta vazia.
6. Verifique se nenhuma tela foi visualmente descaracterizada.
7. Verifique se não restaram mocks usados acidentalmente em fluxos integrados.
8. Não declare a integração concluída se o backend não estiver acessível ou se os contratos não puderem ser validados. Registre claramente o que foi testado e o que ficou pendente.

## Critérios de aceite

A integração só pode ser considerada concluída quando:

- [ ] A URL base da API vem de variável de ambiente.
- [ ] Existe um cliente HTTP centralizado.
- [ ] Endpoints e DTOs foram confirmados no código do backend.
- [ ] Existem serviços por domínio, sem duplicação de chamadas HTTP nas telas.
- [ ] Os hooks necessários foram criados e estão tipados.
- [ ] Consultas e mutações apresentam estados de loading, erro e sucesso.
- [ ] As telas utilizam dados reais nos fluxos integrados.
- [ ] Erros e respostas vazias são tratados corretamente.
- [ ] CORS e autenticação foram verificados e suas limitações documentadas.
- [ ] Os testes e verificações disponíveis foram executados.
- [ ] O design atual, componentes, responsividade e variáveis SCSS foram preservados.
- [ ] Não foram inventados endpoints, campos ou regras de negócio.

## Entrega final do Copilot

Ao concluir, apresente:

1. Resumo da arquitetura de integração.
2. Lista de arquivos criados e alterados.
3. Tabela de hooks criados e telas que os utilizam.
4. Tabela de endpoints realmente conectados.
5. Variáveis de ambiente necessárias.
6. Testes executados e resultados.
7. Pendências do backend, CORS, autenticação ou infraestrutura.
8. Instruções para executar frontend e backend localmente.

**Lembrete final:** primeiro audite e apresente o plano; aguarde aprovação. Só depois implemente. Preserve o frontend atual e crie os hooks necessários com base nos contratos reais do backend.
