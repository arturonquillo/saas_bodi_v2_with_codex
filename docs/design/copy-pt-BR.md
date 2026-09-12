# Copy pt-BR

Canonical strings. Frontend must not invent synonyms for status, channels, or entitlement reasons.

## Shared — status

| Key | Label |
|---|---|
| `novo` | Novo |
| `confirmado` | Confirmado |
| `separando` | Separando |
| `despachado` | Despachado |
| `entregue` | Entregue |
| `cancelado` | Cancelado |

Trail helper: `Novo → Confirmado → Separando → Despachado → Entregue`

## Shared — stock and price

| Key | Label |
|---|---|
| on_hand | Em estoque |
| reserved | Reservado |
| available | Disponível |
| preco_varejo / guest+CPF | Varejo |
| preco_atacado / CNPJ | Atacado |
| qtd_min_atacado | Qtd. mín. {n} un |
| visivel_loja | Visível na loja |
| sem_estoque | Sem estoque |

## Shared — documents

| Key | String |
|---|---|
| cpf | CPF |
| cnpj | CNPJ |
| doc_switch_hint | Informe o documento da conta |
| checksum_invalid | CPF ou CNPJ inválido. |
| cnpj_loading | Consultando CNPJ… |
| cnpj_filled | Confira os dados da empresa. |
| cnpj_registry_down | Não consultamos o CNPJ agora. Você pode continuar e completar os dados. |
| razao_social | Razão social |
| mask_cpf | ***.***.***-00 |
| mask_cnpj | **.***.***/****-00 |

## Shared — actions

| Key | String |
|---|---|
| entrar | Entrar |
| cadastrar | Cadastrar |
| sair | Sair |
| salvar | Salvar |
| cancelar | Cancelar |
| tentar_de_novo | Tentar de novo |
| confirmar | Confirmar |
| fechar | Fechar |

## Shared — notify after status change

Use immediately after a successful transition (SaaS detail). Match tenant `canais_aviso`.

| `canais_aviso` | String |
|---|---|
| `whatsapp` | Cliente avisado no WhatsApp. |
| `email` | Cliente avisado por e-mail. |
| `ambos` | Cliente avisado no WhatsApp e por e-mail. |

Second line (always, after the customer line): `Vendedor avisado no mesmo canal.`

Outbox channel column: `E-mail` · `WhatsApp`  
Outbox status: `Pendente` · `Enviado` · `Falha`

## Shared — entitlement

| Key | String |
|---|---|
| store_blocked_inadimplente | A loja não está aceitando pedidos (assinatura inadimplente). |
| store_blocked_cancelada | A loja não está aceitando pedidos (assinatura cancelada). |
| saas_ro_inadimplente | Assinatura inadimplente. Somente leitura. |
| saas_ro_cancelada | Assinatura cancelada. Somente leitura. |
| account_effect_lock | Pedidos na loja e alterações no SaaS ficarão bloqueados. |
| account_effect_unlock | Pedidos na loja e alterações no SaaS serão liberados. |

Do not add “Ir para a Conta” / “Falar com o financeiro”.

## Store

Woo shop chrome (do not rename status labels). Footer columns use `footer_col_*`; links reuse `nav_catalogo`, `nav_carrinho`, `entrar`, `cadastrar`, `nav_pedidos`. Cart header: `nav_carrinho` + `cart_itens` / `cart_item_one`. Breadcrumb starts with `breadcrumb_inicio`.

| Key | String |
|---|---|
| nav_catalogo | Catálogo |
| nav_carrinho | Carrinho |
| nav_pedidos | Meus pedidos |
| add | Adicionar |
| added | Adicionado ao carrinho |
| qty | Quantidade |
| finalizar | Finalizar pedido |
| entrar_para_pedir | Entrar para pedir |
| pedido_enviado | Pedido enviado |
| pedido_n | Pedido {id} |
| empty_catalog | Nenhum produto visível na loja. |
| empty_cart | Seu carrinho está vazio. |
| empty_orders | Você ainda não fez pedidos. |
| ver_catalogo | Ver catálogo |
| moq_error | Quantidade mínima no atacado: {n}. |
| price_changed | Os preços do carrinho foram atualizados para a sua lista. |
| pdp_unavailable | Produto indisponível. |
| order_not_found | Pedido não encontrado. |
| load_error | Não foi possível carregar. |
| guest_hint | Entre para enviar o pedido. Não vendemos como convidado. |
| password | Senha |
| submit_register | Criar conta |
| submit_login | Entrar |
| catalog_kicker | Estoque visível |
| catalog_lede_guest | Preços de varejo. Cadastre um CNPJ para ver o atacado. |
| catalog_lede_varejo | Lista varejo · CPF |
| catalog_lede_atacado | Lista atacado · CNPJ |
| auth_kicker_store | Acesso do cliente |
| auth_my_account | Minha conta |
| shop_showing | Mostrando {n} produtos |
| shop_showing_one | Mostrando 1 produto |
| cart_itens | {n} itens |
| cart_item_one | 1 item |
| breadcrumb_inicio | Início |
| footer_col_loja | Loja |
| footer_col_conta | Minha conta |

## SaaS — nav and chrome

| Role | Nav items (order) |
|---|---|
| supervisor | Pedidos · Estoque · Chat de estoque · Tema · Configuração · Avisos |
| vendedor | Pedidos · Estoque · Avisos |
| estoquista | Fila do depósito · Estoque |
| entregador | Entregas |

Role chip: `Supervisor` / `Supervisora` (seed: Supervisora) · `Vendedor` · `Estoquista` · `Entregador`

Visual kickers / page subtitles (do not replace nav labels):

| Key | String |
|---|---|
| auth_kicker_saas | Acesso da equipe |
| nav_group_ops | Operação |
| nav_group_casa | Casa |
| kpi_novo | Novos |
| kpi_confirmado | Confirmados |
| kpi_separando | Separando |
| kpi_despachado | Despachados |
| kpi_entregue | Entregues |
| kpi_skus | SKUs |
| kpi_hidden | Ocultos na loja |
| kpi_zero | Sem estoque |
| color_mode | Aparência |
| color_mode_light | Claro |
| color_mode_dark | Escuro |
| color_mode_system | Automático |
| saas_sub_pedidos | Pipeline da casa |
| saas_sub_fila | Confirmado, separando, despachado |
| saas_sub_entregas | Despachado e entregue |
| saas_sub_novo | Preço pela lista do cliente |
| saas_sub_estoque | Em estoque, reservado, disponível |
| saas_sub_chat | Prévia antes de aplicar |
| saas_sub_tema | Cores da loja e do SaaS |
| saas_sub_config | Documentos e canais |
| saas_sub_avisos | Caixa de saída |

## SaaS — Desk chrome

Do not rename status labels. Reuse `customer`, `novo_pedido`, `auth_kicker_saas`, and `saas_sub_*` above.

| Key | String |
|---|---|
| desk_menu | Menu |
| filter_status | Status |
| filter_todos | Todos |
| col_pedido | Pedido |
| col_total | Total |
| col_updated | Atualizado |
| col_sku | SKU |
| col_nome | Nome |
| col_date | Data |
| col_channel | Canal |
| col_dest | Destino |
| col_template | Modelo |
| col_action | Ação |
| col_msg | Msg |
| col_row | # |
| section_items | Itens |
| section_qty | Quantidades |
| history | Histórico |
| load_more | Carregar mais |
| criar_pedido | Criar pedido |

## SaaS — orders

| Key | String |
|---|---|
| novo_pedido | Novo pedido |
| customer | Cliente |
| buscar_cliente | Buscar cliente |
| add_line | Adicionar item |
| unit_price | Preço unitário |
| to_confirmado | Confirmar pedido |
| to_cancelado | Cancelar pedido |
| to_separando | Separar |
| to_despachado | Despachar |
| to_entregue | Marcar entregue |
| confirm_dispatch | Isso baixa o estoque. Confirmar despacho? |
| cancel_confirm | Cancelar este pedido? |
| empty_orders | Nenhum pedido. |
| empty_warehouse | Nada na fila do depósito. |
| empty_courier | Nenhuma entrega. |
| illegal_hidden | (no string — omit the button) |

## SaaS — stock

| Key | String |
|---|---|
| empty_skus | Nenhum SKU. |
| movements | Movimentações |
| adjust | Ajustar quantidade |
| adjust_reason | Motivo |
| adjust_submit | Registrar ajuste |
| visible_on | Visível na loja |
| visible_off | Oculto na loja |
| toggle_hint | Controla se o SKU aparece no catálogo. Não altera quantidades. |

## SaaS — chat

| Key | String |
|---|---|
| chat_title | Chat de estoque |
| chat_empty | Envie um CSV ou XLSX para gerar a prévia. |
| instruction_ph | Instrução curta (opcional) |
| upload | Enviar arquivo |
| parsing | Lendo o arquivo… |
| preview_title | Prévia — nada foi aplicado |
| row_create | Criar |
| row_update | Atualizar |
| row_error | Erro |
| confirm_apply | Confirmar aplicação |
| confirm_hint | Só este botão aplica o estoque. Linhas com erro serão ignoradas. |
| discard_preview | Descartar |
| discarded | Nada foi aplicado. |
| apply_ok | {n} linhas aplicadas. {m} linhas ignoradas. |
| file_unreadable | Não foi possível ler o arquivo. |
| headers_missing | Faltam colunas: {cols}. |
| confirm_disabled_all_bad | Nenhuma linha válida para aplicar. |

Composer placeholder: `Escreva uma instrução ou envie o arquivo.` Sending text alone does **not** apply stock.

## SaaS — theme and config

| Key | String |
|---|---|
| theme_title | Tema |
| theme_marca | Nome da marca |
| theme_primary | Cor principal |
| theme_accent | Cor de destaque |
| theme_background | Fundo |
| theme_logo | Logo |
| theme_save | Salvar tema |
| theme_preview | Prévia |
| theme_contrast | Este fundo não tem contraste suficiente com o texto. |
| theme_logo_missing | Logo indisponível |
| theme_dirty | Descartar alterações do tema? |
| config_title | Configuração |
| aceita_cpf | Aceitar CPF (varejo) |
| aceita_cnpj | Aceitar CNPJ (atacado) |
| last_flag | Mantenha ao menos um documento. |
| canais | Canais de aviso |
| canal_email | E-mail |
| canal_whatsapp | WhatsApp |
| canal_ambos | E-mail e WhatsApp |
| default_seller | Vendedor padrão da loja |
| outbox_title | Avisos |
| empty_outbox | Nenhum aviso registrado. |

## Account

| Key | String |
|---|---|
| title | Conta |
| product | saas_frota |
| plan | Plano |
| status | Status |
| status_ativa | Ativa |
| status_inadimplente | Inadimplente |
| status_cancelada | Cancelada |
| reativar | Reativar |
| marcar_inadimplente | Marcar inadimplente |
| cancelar_assinatura | Cancelar assinatura |
| confirm_inadimplente | Marcar o plano como inadimplente? Pedidos na loja e alterações no SaaS ficarão bloqueados. |
| confirm_cancel | Cancelar a assinatura? Pedidos na loja e alterações no SaaS ficarão bloqueados. |
| confirm_reativar | Reativar o plano? Pedidos na loja e alterações no SaaS serão liberados. |
| save_error | Não foi possível atualizar o plano. |
| forbidden | Você não tem acesso. |
| seed_plan | Plano Demo |
| auth_kicker_account | Acesso da conta |

## Errors (generic)

| Key | String |
|---|---|
| load_error | Não foi possível carregar. |
| save_error | Não foi possível concluir. |
| not_found | Não encontrado. |
| forbidden | Você não tem acesso. |
