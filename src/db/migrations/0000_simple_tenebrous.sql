CREATE TABLE `horarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`remedio_id` integer NOT NULL,
	`hora_minuto` text NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`remedio_id`) REFERENCES `remedios`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ck_horarios_formato" CHECK("horarios"."hora_minuto" GLOB '[0-2][0-9]:[0-5][0-9]')
);
--> statement-breakpoint
CREATE INDEX `idx_horarios_remedio` ON `horarios` (`remedio_id`);--> statement-breakpoint
CREATE INDEX `idx_horarios_hora` ON `horarios` (`hora_minuto`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_horarios_remedio_hora` ON `horarios` (`remedio_id`,`hora_minuto`);--> statement-breakpoint
CREATE TABLE `notificacoes_agendadas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`horario_id` integer NOT NULL,
	`identificador_ios` text NOT NULL,
	`disparo_em` text,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`horario_id`) REFERENCES `horarios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_notificacoes_horario` ON `notificacoes_agendadas` (`horario_id`);--> statement-breakpoint
CREATE INDEX `idx_notificacoes_disparo` ON `notificacoes_agendadas` (`disparo_em`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_notificacoes_identificador` ON `notificacoes_agendadas` (`identificador_ios`);--> statement-breakpoint
CREATE TABLE `preferencias` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`escala_fonte` text DEFAULT 'grande' NOT NULL,
	`som_lembrete` integer DEFAULT 1 NOT NULL,
	`onboarding_concluido_em` text,
	`atualizado_em` text DEFAULT (datetime('now')) NOT NULL,
	CONSTRAINT "ck_preferencias_linha_unica" CHECK("preferencias"."id" = 1),
	CONSTRAINT "ck_preferencias_escala" CHECK("preferencias"."escala_fonte" IN ('grande', 'gigante')),
	CONSTRAINT "ck_preferencias_som" CHECK("preferencias"."som_lembrete" IN (0, 1))
);
--> statement-breakpoint
CREATE TABLE `remedios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`dose` text,
	`forma` text DEFAULT 'comprimido' NOT NULL,
	`frequencia` text DEFAULT 'diario' NOT NULL,
	`intervalo_dias` integer,
	`dias_semana` text,
	`observacao` text,
	`lembrete_ativo` integer DEFAULT 1 NOT NULL,
	`cor` text NOT NULL,
	`arquivado_em` text,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	`atualizado_em` text DEFAULT (datetime('now')) NOT NULL,
	CONSTRAINT "ck_remedios_nome_nao_vazio" CHECK(length(trim("remedios"."nome")) BETWEEN 1 AND 60),
	CONSTRAINT "ck_remedios_forma" CHECK("remedios"."forma" IN ('comprimido', 'capsula', 'gotas', 'xarope', 'injecao', 'pomada', 'spray', 'outro')),
	CONSTRAINT "ck_remedios_frequencia" CHECK("remedios"."frequencia" IN ('diario', 'dias_semana', 'intervalo_dias', 'quando_precisar')),
	CONSTRAINT "ck_remedios_cor" CHECK("remedios"."cor" IN ('coral', 'azul', 'verde', 'amarelo', 'lilas', 'pessego')),
	CONSTRAINT "ck_remedios_intervalo_coerente" CHECK(("remedios"."frequencia" = 'intervalo_dias' AND "remedios"."intervalo_dias" BETWEEN 2 AND 30) OR ("remedios"."frequencia" <> 'intervalo_dias' AND "remedios"."intervalo_dias" IS NULL)),
	CONSTRAINT "ck_remedios_dias_semana_coerente" CHECK(("remedios"."frequencia" = 'dias_semana' AND "remedios"."dias_semana" GLOB '[1-7]*' AND length("remedios"."dias_semana") BETWEEN 1 AND 7) OR ("remedios"."frequencia" <> 'dias_semana' AND "remedios"."dias_semana" IS NULL)),
	CONSTRAINT "ck_remedios_lembrete_ativo" CHECK("remedios"."lembrete_ativo" IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX `idx_remedios_ativos` ON `remedios` (`arquivado_em`);