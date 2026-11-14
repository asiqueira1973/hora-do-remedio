# Hora do Remédio

App iOS de lembrete de remédios pensado para idosos: texto grande, poucos toques, sem conta e sem nuvem.

[Baixar na App Store](https://apps.apple.com/br/app/ta-na-hora-do-rem%C3%A9dio/id6795346505)

Existe também um port Android nativo (Kotlin + Jetpack Compose): [hora-do-remedio-android](https://github.com/asiqueira1973/hora-do-remedio-android).

## Principais funcionalidades

- Cadastro de remédio com nome, dose, forma, frequência (todo dia, dias da semana ou quando precisar), horários e observação.
- Tela principal com os remédios ativos agrupados por horário.
- Lembrete por notificação local, ligado ou desligado por remédio.
- Arquivar ("parar de tomar") e voltar a tomar, sem perder o cadastro.
- Exportação da lista como texto pronto para mandar pelo WhatsApp ou levar ao médico.
- Ajustes de tamanho de letra (grande / gigante) e som do lembrete.
- 100% offline: todos os dados ficam no aparelho, em SQLite.

## Stack técnica

- TypeScript (strict), React Native 0.81, React 19.1, Expo SDK 54
- Expo Router (navegação), expo-sqlite + Drizzle ORM (banco local e migrations empacotadas)
- expo-notifications (lembretes locais), expo-sharing (exportação)
- Jest (`jest-expo`) para testes, ESLint, EAS Build / EAS Submit para distribuição

## Como foi construído

O app foi desenvolvido com Claude (Anthropic) a partir de uma especificação no formato SDD, a [`spec.md`](spec.md), que é a fonte única de verdade de produto, dados e regras de negócio. O que foi de fato implementado (incluindo as divergências em relação à spec) está registrado em [`DOCUMENTACAO-TECNICA.md`](DOCUMENTACAO-TECNICA.md) e [`SCHEMA.md`](SCHEMA.md).

Verificações que existem no repositório:

- Testes automatizados com Jest para as funções puras de agendamento de lembretes, geração do texto exportado, formatação de frequência, agrupamento da tela principal e constraints do banco (as migrations SQL reais rodam num SQLite em memória).
- Constraints e triggers no próprio banco (`src/db/migrations/`) garantindo as regras de dados.
- Checagem de tipos (`tsc --noEmit`, strict) e lint (ESLint).

## Status

Publicado na App Store (iOS).

## Como rodar

Requisitos: Node 20 LTS ou mais recente, Xcode, Expo SDK 54 (versão fixa por decisão da spec). Só há build iOS; não existe `.env` nem variável de ambiente para configurar.

```bash
npm install
npm run ios          # builda o app nativo e abre no simulador
npm test             # testes (Jest)
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
```

Na primeira vez, ou depois de mudar `app.json` ou adicionar um módulo nativo:

```bash
npx expo prebuild --platform ios
cd ios && pod install && cd ..
```

### Banco de dados e migrations

O schema Drizzle fica em `src/db/schema.ts`. Depois de qualquer mudança nele, rode `npm run db:generate` para gerar uma nova migration em `src/db/migrations/`. As migrations são empacotadas com o app e aplicadas automaticamente na abertura (`src/db/client.ts`). A migration `0001_triggers.sql` é escrita à mão porque o Drizzle não modela `CREATE TRIGGER`.

### Estrutura do projeto

```
app/                    # rotas do Expo Router (Onboarding, Home, Cadastro, Detalhe, Ajustes...)
src/db/                 # schema Drizzle, migrations, client, seed
src/repositories/       # acesso ao banco
src/features/           # lógica por domínio: medications, reminders, export, settings
src/components/         # componentes de UI reutilizáveis
src/theme/              # tokens de cor, tipografia e espaçamento
src/constants/textos.ts # todas as strings de interface num lugar só
```

## Licença

O código está disponível apenas para leitura e estudo. Veja [LICENSE](LICENSE).

## Contribuições

Issues são bem-vindas; pull requests não são aceitos. Veja [CONTRIBUTING.md](CONTRIBUTING.md).

---

Feito pela [Dab Lab](https://www.dablab.com.br/) — agência de inovação no-code para startups e PMEs, com automações usando IA.
