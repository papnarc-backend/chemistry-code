# Chemistry Code — Paulo Vicente

**[Acesse o portfólio](https://papnarc-backend.github.io/chemistry-code/)**

Portfólio de estudo que conecta Análise e Desenvolvimento de Sistemas e Técnico em Química. Desenvolvido para apresentar projetos, tecnologias e aprendizados no GitHub e LinkedIn.

## Projetos

- **LabDilui:** calculadora educativa funcional. O autor confirmou a execução local da aplicação; seu código está em [papnarc-backend/LabDilui](https://github.com/papnarc-backend/LabDilui).
- **CurvaLab, Reagente360, AmostraHub, QuimiCards e QualiData:** ideias demonstrativas, com dados fictícios, explicitamente identificadas.

Cada projeto apresenta problema, solução, resultado do exemplo e próximos passos. Há filtros por área, busca por tecnologia, cartões educativos e exportação de dados simulados em CSV.

## Abrir e publicar

Abra `index.html` para acessar o portfólio. As interações funcionam com JavaScript no navegador e não dependem de um servidor de aplicação.

Para hospedar, siga [PUBLICAR.md](PUBLICAR.md). O pacote está preparado para GitHub Pages, inclusive quando o endereço contém o nome do repositório.

## Organização

- `index.html`: apresentação, competências e projetos.
- `projetos/`: seis páginas com estudo de caso e interface interativa.
- `assets/`: aparência, scripts e ícone.
- `build.py`: conteúdo e geração das páginas estáticas.
- `tests/`: verificações de cálculos, interações e navegação.

Para reconstruir as páginas após editar o conteúdo, use `python3 build.py`. Depois execute `python3 tests/check_site.py`; a verificação das interações requer Node.js.

## Apresentação

Paulo Vicente Rocha Pinto, estudante de ADS e Técnico em Química. Os resultados apresentados são exemplos matemáticos ou simulações, sem alegações de experiência profissional ou validação experimental. As imagens são prévias ilustrativas; não são fotografias de laboratório.

## Código do LabDilui

[Repositório do LabDilui](https://github.com/papnarc-backend/LabDilui)
