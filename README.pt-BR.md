# Mehrdadika · Atlas visual de inglês

[Abrir a prévia em português](https://mehrdadxzaker.github.io/mehrdadika/#/pt-BR) · [English](README.md) · [فارسی](README.fa.md) · [Código no GitHub](https://github.com/mehrdadxzaker/mehrdadika)

Um projeto de código aberto para aprender vocabulário de inglês com imagens e exemplos, adaptado do [Word Atlas](https://github.com/designfuchen/word-atlas). A edição inicial foi criada para falantes de persa; o português brasileiro começa como uma prévia própria.

## O que já está disponível

- 56 palavras, 57 sentidos e 114 exemplos traduzidos para português brasileiro.
- 32 categorias, com conteúdo publicado aos poucos, incluindo culinária, medicina e engenharia.
- Busca em inglês e português, filtro de nível, cartões ilustrados e combinações frequentes.
- Pronúncia britânica e americana e palavras salvas neste navegador.

As traduções tiveram apoio de IA e ainda aguardam revisão humana independente. O vocabulário especializado também precisa de revisão por profissionais da área. A presença de uma categoria não significa que todo o seu conteúdo já está publicado.

As aulas com revisão espaçada, a biblioteca e os demais exercícios em português serão ampliados em etapas posteriores. Os dados salvos desta prévia ficam separados do histórico da edição em persa. O português europeu é uma futura localização distinta.

## Executar e contribuir

Use Node.js 22 ou mais recente:

```sh
npm ci
npm run dev
```

Abra o endereço local exibido no terminal e escolha **Português (Brasil)**. Não é necessário fornecer uma chave de API, criar uma conta de IA ou configurar um banco de dados.

```sh
npm test
npm run check:content
npm run build
```

Veja as [notas de conteúdo em português](docs/portuguese-content.md), o [roteiro de localização](docs/localization-roadmap.md) e o [guia de contribuição](CONTRIBUTING.md). Correções e revisão de traduções são bem-vindas; não atribua aprovação humana a conteúdo ainda não revisado.

## Licenças e créditos

O código usa a [licença MIT](LICENSE). O conteúdo segue as condições em [CONTENT_LICENSE.md](CONTENT_LICENSE.md), incluindo atribuição CC BY 4.0 quando aplicável. Imagens, áudio e vocabulário adaptados: **Word Atlas contributors — CC BY 4.0**. Traduções e notas em português: **Mehrdadika contributors**. Fontes e dependências mantêm suas próprias licenças, descritas nos [avisos de terceiros](THIRD_PARTY_NOTICES.md).
