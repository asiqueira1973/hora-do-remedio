# Hora do Remédio

App iOS de lembrete de remédios para idosos — texto grande, poucos toques, sem conta, sem nuvem.
A especificação completa está em [`spec.md`](spec.md) (fonte única de verdade); o sistema como
ficou implementado de fato está documentado em [`DOCUMENTACAO-TECNICA.md`](DOCUMENTACAO-TECNICA.md)
e [`SCHEMA.md`](SCHEMA.md).

Repositório: https://github.com/asiqueira1973/hora-do-remedio (privado).

## Requisitos

| Ferramenta | Versão usada nesta implementação |
| :---- | :---- |
| Node | 22.20.0 (qualquer 20 LTS+ funciona) |
| Xcode | 26.1.1 |
| Expo SDK | 54 (fixo — ver seção 4 do `spec.md`, não atualizar sem decidir de novo) |
| iOS mínimo | 16.0 (`expo-build-properties`) |
| Plataforma | Só iOS (`platforms: ["ios"]` no `app.json`) — não há build Android |

## Setup local

```bash
npm install
```

Não há `.env` nem segredo (18.5) — não existe nenhuma variável de ambiente a configurar.

## Rodar no simulador

```bash
npm run ios
```

Isso builda o app nativo (CocoaPods incluso) e abre no simulador padrão configurado no Xcode. Para
escolher outro simulador ou porta:

```bash
npx expo run:ios --port 8082 --device "<nome ou UDID do simulador>"
```

Na primeira vez, ou depois de mudar `app.json`/adicionar um módulo nativo, rode antes:

```bash
npx expo prebuild --platform ios
cd ios && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install && cd ..
```

## Rodar num iPhone físico

Conecte o aparelho, selecione-o no Xcode (`ios/HoraDoRemedio.xcworkspace`) como destino e rode
`npm run ios -- --device`, ou abra o workspace direto no Xcode e rode por lá — é o caminho mais
simples para assinatura de desenvolvedor.

## Banco de dados e migrations

O schema Drizzle vive em `src/db/schema.ts`. Depois de qualquer mudança nele:

```bash
npm run db:generate
```

Isso escreve uma nova migration em `src/db/migrations/` (nunca editar as migrations já geradas à
mão, exceto a customizada `0001_triggers.sql`, que existe porque o Drizzle não modela
`CREATE TRIGGER`). As migrations são empacotadas com o app e aplicadas automaticamente na abertura
(`src/db/client.ts`) — não há CLI de migration rodando no aparelho do usuário final.

Depois de gerar uma migration nova, atualize `SCHEMA.md` (dump real do banco, nunca escrito à mão) e
`DOCUMENTACAO-TECNICA.md` no mesmo commit (regra da seção 18.6 do spec).

## Testes

```bash
npm test
```

Roda os testes obrigatórios da seção 22.1 do spec com Jest (`jest-expo/ios`): as funções puras de
agendamento (`agendamentoPuro.ts`), a geração do texto de exportação (`exportadorLista.ts`,
comparação literal com o exemplo da 14.1), a codificação de `dias_semana`, o agrupamento/ordenação
da Home, e as constraints do banco (rodando as migrations SQL reais num SQLite em memória via
`node:sqlite` — ver a divergência sobre o teste 22.1.6 em `DOCUMENTACAO-TECNICA.md` §19.6).

```bash
npm run typecheck   # tsc --noEmit, strict
npm run lint        # ESLint (config do Expo)
```

## Buildar e enviar no EAS

`eas.json` já está configurado e o projeto linkado (`@alexsiq/hora-do-remedio` no EAS, App ID
`com.dablab.horadoremedio` no Apple Developer, app "Hora do Remédio" no App Store Connect —
roteiro completo do Anexo B do `spec.md` já percorrido uma vez, incluindo o primeiro build de
produção enviado). Para builds seguintes:

```bash
npx eas-cli build --platform ios --profile preview     # TestFlight interno (sem submeter)
npx eas-cli build --platform ios --profile production  # build de loja
npx eas-cli submit --platform ios --profile production --latest  # envia o último build ao App Store Connect
```

As credenciais de assinatura (Distribution Certificate + Provisioning Profile) ficam armazenadas
remotamente no EAS (`credentialsSource: "remote"`) — não precisa gerar de novo a cada build. A
chave de API do App Store Connect usada pelo `eas submit` (`ascApiKeyPath`/`ascApiKeyId`/
`ascApiKeyIssuerId` em `eas.json`) aponta para um arquivo `.p8` em `secrets/`, **fora do controle
de versão** (`*.p8` no `.gitignore`) — se for clonar este repositório num Mac novo, gere uma chave
nova em App Store Connect → Users and Access → Integrations (acesso **App Manager**) e coloque o
`.p8` em `secrets/` antes de rodar `eas submit`.

Bump de `expo.ios.buildNumber` é automático (`autoIncrement: true` no perfil `production`) — não
precisa incrementar à mão.

O restante do checklist de submissão (categoria, Age Rating, screenshots, descrição/keywords,
página de Suporte) segue o checklist B.8 do `spec.md`.

## Estrutura do projeto

Ver a árvore completa na seção 18.3 do `spec.md`. Resumo:

```
app/                  # rotas do Expo Router (Onboarding, Home, Cadastro, Detalhe, Ajustes, ...)
src/db/               # schema Drizzle, migrations, client, seed
src/repositories/      # acesso ao banco (repositorioRemedios, repositorioPreferencias)
src/features/          # lógica por domínio: medications, reminders, export, settings
src/components/        # componentes de UI reutilizáveis (TextoGrande, BotaoPrimario, ...)
src/theme/              # tokens de cor, tipografia e espaçamento (seção 16 do spec)
src/constants/textos.ts # todas as strings de interface, num lugar só (seção 15 do spec)
```
