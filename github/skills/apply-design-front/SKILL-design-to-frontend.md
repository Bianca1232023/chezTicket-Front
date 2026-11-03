---
name: apply-design-to-frontend
description: Inspects the project's design folder and applies its visual references, assets, typography, and existing SCSS design tokens to the frontend without changing backend behavior.
---

# Apply Design to Frontend

## Objetivo

Aplicar no frontend do CheezTicket o material visual existente na pasta `design/` (ou na pasta equivalente já utilizada pelo projeto): telas exportadas do Figma, imagens, SVGs, ícones, fontes, documentação e demais referências. Esta Skill é exclusivamente visual e de frontend. Ela não implementa, altera ou integra regras de negócio do backend.

## Regra principal: primeiro investigar, depois planejar

Antes de editar qualquer arquivo:

1. Inspecione a estrutura real do repositório e identifique o frontend, sua stack, roteamento, componentes e estilos.
2. Localize a pasta `design/` e liste recursivamente seu conteúdo. Não presuma nomes, quantidade de telas ou caminhos.
3. Localize a pasta `style/` do frontend e leia todos os arquivos SCSS relacionados a variáveis, tokens, fontes, mixins e estilos globais.
4. Identifique as telas e assets disponíveis, associando cada referência à página ou componente correspondente.
5. Consulte instruções existentes em `.github/copilot-instructions.md`, documentação e Skills relevantes.
6. Apresente um diagnóstico e um plano de implementação. **Aguarde aprovação explícita antes de modificar qualquer arquivo.**

Não crie uma nova pasta `design/`, `style/`, um novo Design System ou arquivos de tokens se já existir uma estrutura equivalente.

## Fonte de verdade visual

Use esta ordem de prioridade:

1. Referências e especificações existentes em `design/`.
2. Variáveis, mixins e tokens SCSS existentes em `style/`.
3. Componentes e padrões já implementados no frontend.
4. Documentação do projeto.

Não invente telas, textos, componentes, ícones, cores, fontes, espaçamentos ou estados que não estejam nas referências ou no código existente. Quando uma informação visual não puder ser determinada, registre a dúvida no plano e solicite orientação em vez de adivinhar.

## Design tokens e variáveis SCSS

A pasta `style/` do frontend já contém variáveis SCSS de cores. Elas são a fonte oficial de cores do projeto.

Obrigatório:

- Ler os arquivos SCSS existentes antes de implementar qualquer tela.
- Identificar os nomes exatos das variáveis de cor e seus valores.
- Reutilizar essas variáveis em componentes, páginas e estilos novos.
- Preservar nomes, valores e organização existentes.
- Não criar variáveis de cor duplicadas, não substituir tokens por HEX/RGB hardcoded e não alterar a paleta sem aprovação.
- Verificar se os estilos existentes já definem tipografia, tamanhos, pesos, line-height, espaçamentos, bordas, sombras e breakpoints; reutilizá-los quando existirem.
- Se faltar um token necessário, apontar a lacuna no plano e propor a inclusão no arquivo apropriado, aguardando aprovação.

Antes da implementação, produza no diagnóstico uma tabela com: função visual, nome exato da variável SCSS, valor encontrado e arquivo de origem. Não invente nomes nem valores. Se não encontrar uma variável, escreva `não localizado`.

## Fontes e tipografia

A tipografia deve ser identificada a partir dos arquivos reais do projeto e das referências de design.

atualmente está sendo utilizadas as fontes unbounded e manrope:

.unbounded-<uniquifier> {
  font-family: "Unbounded", sans-serif;
  font-optical-sizing: auto;
  font-weight: <weight>;
  font-style: normal;
}

.manrope-<uniquifier> {
  font-family: "Manrope", sans-serif;
  font-optical-sizing: auto;
  font-weight: <weight>;
  font-style: normal;
}

Investigue:

1. Arquivos de fonte em `design/`, `public/`, `assets/` ou diretórios equivalentes (`.woff2`, `.woff`, `.ttf`, `.otf`).
2. Declarações `@font-face`, imports e `font-family` nos arquivos CSS/SCSS.
3. Configuração de fontes do framework, como `next/font`, se o projeto usar Next.js.
4. Metadados/documentação do Figma exportados junto ao design, quando disponíveis.
5. Aparência tipográfica das telas como evidência complementar, nunca como prova suficiente para afirmar o nome de uma fonte.

No plano, documente separadamente:

- Fonte principal (nome exato, origem/arquivo e pesos disponíveis).
- Fonte secundária, se houver.
- Fonte de títulos e corpo, se forem diferentes.
- Fallbacks existentes.
- Arquivo de configuração atual.

Não escolha uma fonte apenas por semelhança visual. Se o nome não puder ser confirmado pelos arquivos ou documentação, informe que a família tipográfica está pendente de confirmação. Preserve a configuração existente e não carregue uma fonte externa sem aprovação.

## Uso das referências e assets

- Relacione cada imagem/tela de `design/` à rota ou componente correspondente.
- Use os SVGs e imagens fornecidos sempre que corresponderem ao elemento visual.
- Preserve proporção, enquadramento e qualidade dos assets.
- Não redesenhe um logo ou ícone que já exista como asset.
- Não use capturas de tela inteiras como fundo para simular uma página; reconstrua a interface com componentes reais.
- Compare desktop e mobile quando ambas as referências existirem.
- Se houver versões conflitantes da mesma tela, não escolha silenciosamente: descreva a divergência e peça confirmação.

## Escopo permitido

Esta Skill pode:

- Criar ou ajustar páginas, componentes e estilos do frontend para reproduzir o design aprovado.
- Organizar componentes visuais reutilizáveis conforme a arquitetura existente.
- Priorizar componentes visuais genéricos e reutilizáveis quando o mesmo padrão aparecer em mais de uma tela ou puder atender a variações previstas no projeto. Antes de criar um componente novo, procurar padrões equivalentes já existentes e reutilizá-los ou estendê-los.
- Projetar componentes compartilhados com responsabilidades claras e APIs simples, usando props, children ou os mecanismos já adotados pelo projeto para acomodar variações visuais e de conteúdo sem acoplar o componente a uma página específica.
- Manter estilos compartilhados junto aos componentes ou nos arquivos globais apropriados, seguindo a organização existente e reutilizando os tokens SCSS disponíveis.
- Importar e referenciar assets que já estejam em `design/`.
- Aplicar responsividade conforme as referências disponíveis.
- Ajustar estados puramente visuais (hover, focus, disabled, loading) somente quando estiverem especificados ou já existirem no projeto.

Essa diretriz não significa generalizar tudo: não crie abstrações, variantes ou componentes compartilhados sem um caso de reutilização concreto. Mantenha componentes específicos quando a estrutura ou o comportamento visual realmente pertencer apenas àquela tela.

Esta Skill não pode:

- Alterar backend, endpoints, DTOs, entidades, banco de dados ou regras de negócio.
- Criar dados fictícios ou simular integrações como se fossem reais.
- Alterar contratos de API, autenticação, pagamentos ou permissões.
- Reescrever configurações gerais, trocar bibliotecas ou instalar dependências sem necessidade e aprovação.
- Modificar a paleta SCSS ou inventar uma nova identidade visual.

Se uma tela depender de dados ou comportamento ainda não implementado, mantenha a camada visual dentro do escopo e registre a dependência; não invente a lógica.

## Organização de componentes e páginas

Separar responsabilidades é obrigatório. Nunca concentre tela, componentes e estilos em um único arquivo (como `App.tsx`).

- **`src/components/`**: todo elemento visual reutilizável ou com responsabilidade própria (inputs, botões, checkbox, header, footer, cards, painéis, layouts compartilhados etc.). Cada componente fica em sua própria pasta, com o `.tsx` e o `.scss` correspondentes, por exemplo `components/TextField/TextField.tsx` e `components/TextField/TextField.scss`.
- **`src/pages/`**: uma pasta por tela, contendo apenas o `.tsx` (por exemplo `pages/Login/Login.tsx`). A página apenas compõe componentes e define o conteúdo/textos da tela.
- **`src/styles/pages/`**: os estilos próprios de cada página ficam aqui, em um arquivo por tela com nome em kebab-case (por exemplo `styles/pages/login.scss`, `styles/pages/explorar-eventos.scss`), e a página o importa (`import '../../styles/pages/login.scss'`). Esse arquivo contém somente ajustes específicos daquela tela (layout da página, espaçamentos entre seções, sobrescritas de componentes); nada que pertença a um componente reutilizável. Use `@use '../variables' as tokens;` para acessar os tokens.
- **`App.tsx`**: apenas monta as páginas (e o roteamento, quando existir). Não deve conter marcação nem estilos de tela.
- Componentes recebem variações por props/children e não conhecem nenhuma página específica. Variantes de página (ex.: modificadores de layout) entram por props do componente, e os ajustes pontuais ficam em `src/styles/pages/`.
- Cada componente importa o próprio `.scss` (na pasta do componente), que usa `@use` com os tokens de `src/styles/` (sem hardcode de cores).
- Ao dividir estilos, preserve especificidade e ordem do CSS para que o resultado visual continue idêntico à referência aprovada; confira com medidas de layout antes e depois quando se tratar de refatoração.
- Antes de criar um componente, verifique `src/components/` por um equivalente que possa ser reutilizado ou estendido (ex.: `Header`, `Footer`, `Icon`, `Button`, `TextField`). Itens usados por uma única página, sem previsão de reuso, podem permanecer no arquivo da própria página ou do componente que os utiliza (ex.: ícones internos).
- Assets (imagens, logos) ficam em `src/assets/`, agrupados por tela quando específicos dela (por exemplo `src/assets/home/`). Quando o design só traz a tela exportada, recorte apenas a região limpa da imagem (sem textos ou overlays embutidos) e reconstrua os textos como HTML.
- Não implemente elementos que o responsável pelo projeto pediu para adiar (por exemplo, o QR code da nota fiscal fica de fora por enquanto, incluindo o texto "Escaneie o QrCode…").
- Quando não houver roteador instalado, a navegação entre páginas usa o hook `src/hooks/useRoute.ts` (rotas por hash, ex.: `#/explorar`), sem adicionar dependências.

## Tokens complementares

Se uma cor não existir em `src/styles/variables.scss`, primeiro tente derivá-la dos tokens existentes (por exemplo `rgba(tokens.$bg-primary, 0.4)` para tons claros de roxo/azul). Apenas quando isso não for possível, acrescente um token novo **ao final** de `variables.scss`, em bloco comentado como "Tokens complementares", sem alterar nenhum token existente, e registre a adição no relatório final.

## Processo de implementação após aprovação

Para cada tela ou conjunto de componentes aprovado:

1. Abrir a referência exata em `design/`.
2. Identificar a rota, layout e componentes existentes que serão reutilizados.
3. Identificar padrões visuais compartilhados com outras telas e componentes existentes que possam ser reaproveitados.
4. Mapear cores para as variáveis SCSS já existentes.
5. Mapear tipografia para as fontes e pesos confirmados.
6. Identificar assets e ícones correspondentes.
7. Implementar a estrutura visual usando os padrões atuais do frontend: componentes em `src/components/` (um por pasta, com `.tsx` e `.scss`) e a tela em `src/pages/` (uma pasta por página), conforme a seção "Organização de componentes e páginas".
8. Implementar responsividade apenas com base nas referências/regras disponíveis.
9. Executar lint, typecheck e testes disponíveis, sem alterar funcionalidades não relacionadas.
10. Comparar o resultado com a referência e listar diferenças ainda existentes.
11. Informar todos os arquivos criados/alterados e eventuais pendências.

Trabalhe uma tela ou funcionalidade por vez. Não implemente todas as telas em lote sem aprovação específica.

## Formato obrigatório do diagnóstico e plano

Antes de editar, apresente:

### 1. Estrutura encontrada
- Caminho da pasta de design.
- Lista de telas e assets relevantes.
- Caminho do frontend.
- Caminho da pasta `style/`.

### 2. Tipografia identificada
| Uso | Família | Pesos | Origem | Status |
|---|---|---|---|---|

Preencha apenas com dados confirmados. Use `não localizado` quando necessário.

### 3. Tokens SCSS encontrados
| Uso | Variável SCSS exata | Valor | Arquivo |
|---|---|---|---|

Não crie nomes fictícios para preencher a tabela.

### 4. Mapeamento das telas
| Referência em design/ | Rota/componente frontend | Assets | Observações |
|---|---|---|---|

### 5. Plano de alterações
Liste arquivos que pretende criar ou modificar e explique o motivo de cada alteração, separando o que ficará em `src/components/`, `src/pages/` e `src/styles/pages/`.

### 6. Pendências e dúvidas
Liste fontes não confirmadas, tokens ausentes, referências ambíguas e dependências visuais.

Finalize solicitando aprovação. Não faça alterações até recebê-la.

## Critérios de conclusão

- A tela corresponde à referência aprovada.
- Cores utilizam as variáveis SCSS existentes, sem valores hardcoded desnecessários.
- Fontes e pesos correspondem às famílias confirmadas no projeto.
- Assets existentes foram reutilizados corretamente.
- A implementação segue a arquitetura e os padrões do frontend.
- Componentes estão em `src/components/` (cada um com `.tsx` e `.scss`), páginas em `src/pages/` e os estilos próprios de cada página em `src/styles/pages/`; `App.tsx` apenas compõe as páginas.
- Nenhum arquivo ou comportamento do backend foi alterado.
- Lint, typecheck e testes disponíveis foram executados ou suas limitações foram registradas.
- Diferenças visuais e pendências foram documentadas.
