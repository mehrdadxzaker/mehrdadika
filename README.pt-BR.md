# Mehrdadika · Atlas visual de inglês

[Abrir a edição em português](https://mehrdadxzaker.github.io/mehrdadika/#/pt-BR) · [English](README.md) · [فارسی](README.fa.md) · [Español](README.es-419.md) · [Código no GitHub](https://github.com/mehrdadxzaker/mehrdadika)

Um projeto de código aberto para aprender vocabulário de inglês com imagens e exemplos, adaptado do [Word Atlas](https://github.com/designfuchen/word-atlas). A edição inicial foi criada para falantes de persa; o português brasileiro e a primeira edição em espanhol latino-americano agora usam as mesmas funções principais. Todas as edições ensinam inglês, com orientações na língua do estudante.

## O que já está disponível

- 127 palavras, 128 sentidos, 256 exemplos, 381 combinações frequentes e 127 notas de uso em português brasileiro.
- 32 categorias e 348 subcategorias traduzidas, com conteúdo publicado aos poucos, incluindo culinária, medicina e engenharia.
- Introdução ao estudo, metas diárias, recordação ativa e revisão espaçada com FSRS.
- Atlas com cartões ilustrados, busca, filtros, palavras salvas e galáxia de progresso.
- Biblioteca com três textos curtos e um livro original de três capítulos, tradução, perguntas de compreensão, marcadores e retomada da leitura.
- Prática de digitação, cópia de frases, ditado, paráfrases e palavras que causam confusão.
- Preferências e cópias de segurança do progresso local.

As traduções tiveram apoio de IA e ainda aguardam revisão humana independente. O vocabulário especializado também precisa de revisão por profissionais da área. A presença de uma categoria não significa que todo o seu conteúdo já está publicado.

O progresso, as sessões e os dados de leitura ficam separados por edição. As palavras salvas na prévia anterior em português são migradas para esta edição. A culinária agora reúne 50 palavras, com 36 adições ilustradas nesta etapa. O conteúdo cresce por categoria; medicina e engenharia vêm a seguir. Veja o [plano das 32 categorias](docs/category-expansion.md). As palavras novas incluem ilustrações originais; quando ainda não há gravação licenciada, a pronúncia usa a voz inglesa disponível no dispositivo. A narração de textos e livros também depende do dispositivo. O português europeu continua previsto como uma localização distinta.

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

Veja as [notas de conteúdo em português](docs/portuguese-content.md), as [notas de leitura e prática](docs/localized-reading-content.md), o [roteiro de localização](docs/localization-roadmap.md) e o [guia de contribuição](CONTRIBUTING.md). Correções e revisão de traduções são bem-vindas; não atribua aprovação humana a conteúdo ainda não revisado.

## Licenças e créditos

O código usa a [licença MIT](LICENSE). O conteúdo segue as condições em [CONTENT_LICENSE.md](CONTENT_LICENSE.md), incluindo atribuição CC BY 4.0 quando aplicável. Imagens, áudio e vocabulário adaptados: **Word Atlas contributors — CC BY 4.0**. Traduções e notas em português: **Mehrdadika contributors**. Fontes e dependências mantêm suas próprias licenças, descritas nos [avisos de terceiros](THIRD_PARTY_NOTICES.md).

## Ciências em inglês

Em **Biblioteca → Cursos**, explore **Water and Weather**: oito lições ilustradas para praticar inglês descrevendo observações, comparando e explicando causas. O curso oferece ajuda em português brasileiro, 32 atividades e oito propostas de escrita com exemplos e autoavaliação. As 19 novas palavras de ciências usam a revisão de vocabulário existente; concluir uma lição não altera o domínio das palavras. O progresso fica neste dispositivo e participa do backup e do pacote de produção offline. O conteúdo é uma prévia editorial com apoio de IA e ainda aguarda revisão independente. [Guia do curso](docs/science-course.md).
