import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TENANT = "tenant_demo";
const PASSWORD = "Demo@1234";

const ids = {
  dono: "usr_dono",
  supervisora: "usr_supervisora",
  vendedor: "usr_vendedor",
  estoque: "usr_estoque",
  entregador: "usr_entregador",
  clienteCpf: "usr_cliente_cpf",
  clienteCnpj: "usr_cliente_cnpj",
  skuCamiseta: "sku_camiseta",
  skuKit: "sku_kit",
  skuOculto: "sku_oculto",
  skuEsgotado: "sku_esgotado",
} as const;

async function main() {
  await prisma.inventoryImportRow.deleteMany();
  await prisma.inventoryImportBatch.deleteMany();
  await prisma.notificationOutbox.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventoryBalance.deleteMany();
  await prisma.sku.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await prisma.user.createMany({
    data: [
      { id: ids.dono, email: "dono@demo.local", passwordHash, nome: "Dono Demo", whatsapp: "+5511999990000" },
      { id: ids.supervisora, email: "supervisora@demo.local", passwordHash, nome: "Supervisora Demo" },
      { id: ids.vendedor, email: "vendedor@demo.local", passwordHash, nome: "Vendedor Demo", whatsapp: "+5511999990002" },
      { id: ids.estoque, email: "estoque@demo.local", passwordHash, nome: "Estoquista Demo" },
      { id: ids.entregador, email: "entregador@demo.local", passwordHash, nome: "Entregador Demo" },
      { id: ids.clienteCpf, email: "cliente.cpf@demo.local", passwordHash, nome: "Cliente CPF", whatsapp: "+5511999990001" },
      { id: ids.clienteCnpj, email: "cliente.cnpj@demo.local", passwordHash, nome: "Cliente CNPJ", whatsapp: "+5511999990003" },
    ],
  });

  await prisma.tenant.create({
    data: {
      id: TENANT,
      slug: "demo",
      nome: "Norte Atacado",
      aceitaCpf: true,
      aceitaCnpj: true,
      canaisAviso: "ambos",
      defaultSellerUserId: ids.vendedor,
      subscriptionStatus: "ativa",
      planDisplayName: "Plano Demo",
    },
  });

  await prisma.theme.create({
    data: {
      tenantId: TENANT,
      marca: "Norte Atacado",
      primary: "#0F4F3E",
      accent: "#C2410C",
      background: "#F6EFE3",
      logoUrl: null,
    },
  });

  await prisma.membership.createMany({
    data: [
      { id: "mem_dono", tenantId: TENANT, userId: ids.dono, saasRole: "supervisor", accountOwner: true, isCustomer: false },
      { id: "mem_supervisora", tenantId: TENANT, userId: ids.supervisora, saasRole: "supervisor", accountOwner: false, isCustomer: false },
      { id: "mem_vendedor", tenantId: TENANT, userId: ids.vendedor, saasRole: "vendedor", accountOwner: false, isCustomer: false },
      { id: "mem_estoque", tenantId: TENANT, userId: ids.estoque, saasRole: "estoquista", accountOwner: false, isCustomer: false },
      { id: "mem_entregador", tenantId: TENANT, userId: ids.entregador, saasRole: "entregador", accountOwner: false, isCustomer: false },
      { id: "mem_cpf", tenantId: TENANT, userId: ids.clienteCpf, saasRole: null, accountOwner: false, isCustomer: true },
      { id: "mem_cnpj", tenantId: TENANT, userId: ids.clienteCnpj, saasRole: null, accountOwner: false, isCustomer: true },
    ],
  });

  await prisma.customerProfile.createMany({
    data: [
      {
        id: "cpf_demo",
        tenantId: TENANT,
        userId: ids.clienteCpf,
        documentType: "cpf",
        documentDigits: "52998224725",
        documentLast4: "4725",
        cnpjRegistroPendente: false,
      },
      {
        id: "cnpj_demo",
        tenantId: TENANT,
        userId: ids.clienteCnpj,
        documentType: "cnpj",
        documentDigits: "11222333000181",
        documentLast4: "0181",
        cnpjRegistroPendente: false,
        razaoSocial: "Cliente Atacado Demo Ltda",
      },
    ],
  });

  await prisma.sku.createMany({
    data: [
      {
        id: ids.skuCamiseta,
        tenantId: TENANT,
        codigo: "CAMISETA-BASICA",
        nome: "Camiseta básica",
        precoVarejoCentavos: 5990,
        precoAtacadoCentavos: 3990,
        qtdMinAtacado: 1,
        visivelLoja: true,
      },
      {
        id: ids.skuKit,
        tenantId: TENANT,
        codigo: "KIT-ATACADO-10",
        nome: "Kit atacado 10 peças",
        precoVarejoCentavos: 19900,
        precoAtacadoCentavos: 14900,
        qtdMinAtacado: 10,
        visivelLoja: true,
      },
      {
        id: ids.skuOculto,
        tenantId: TENANT,
        codigo: "OCULTO-INTERNO",
        nome: "Peça uso interno",
        precoVarejoCentavos: 1000,
        precoAtacadoCentavos: 800,
        qtdMinAtacado: 1,
        visivelLoja: false,
      },
      {
        id: ids.skuEsgotado,
        tenantId: TENANT,
        codigo: "ESGOTADO-VITRINE",
        nome: "Item vitrine esgotado",
        precoVarejoCentavos: 8900,
        precoAtacadoCentavos: 7000,
        qtdMinAtacado: 1,
        visivelLoja: true,
      },
    ],
  });

  await prisma.inventoryBalance.createMany({
    data: [
      { skuId: ids.skuCamiseta, tenantId: TENANT, onHand: 50, reserved: 5 },
      { skuId: ids.skuKit, tenantId: TENANT, onHand: 80, reserved: 0 },
      { skuId: ids.skuOculto, tenantId: TENANT, onHand: 20, reserved: 0 },
      { skuId: ids.skuEsgotado, tenantId: TENANT, onHand: 2, reserved: 2 },
    ],
  });

  type SeedOrder = {
    id: string;
    status: "novo" | "confirmado" | "separando" | "despachado" | "entregue" | "cancelado";
    customer: string;
    priceList: "varejo" | "atacado";
    lines: { skuId: string; codigo: string; nome: string; qty: number; unit: number }[];
  };

  const orders: SeedOrder[] = [
    {
      id: "ped_novo",
      status: "novo",
      customer: ids.clienteCpf,
      priceList: "varejo",
      lines: [{ skuId: ids.skuCamiseta, codigo: "CAMISETA-BASICA", nome: "Camiseta básica", qty: 1, unit: 5990 }],
    },
    {
      id: "ped_confirmado",
      status: "confirmado",
      customer: ids.clienteCpf,
      priceList: "varejo",
      lines: [
        { skuId: ids.skuCamiseta, codigo: "CAMISETA-BASICA", nome: "Camiseta básica", qty: 3, unit: 5990 },
        { skuId: ids.skuEsgotado, codigo: "ESGOTADO-VITRINE", nome: "Item vitrine esgotado", qty: 2, unit: 8900 },
      ],
    },
    {
      id: "ped_separando",
      status: "separando",
      customer: ids.clienteCnpj,
      priceList: "atacado",
      lines: [{ skuId: ids.skuCamiseta, codigo: "CAMISETA-BASICA", nome: "Camiseta básica", qty: 2, unit: 3990 }],
    },
    {
      id: "ped_despachado",
      status: "despachado",
      customer: ids.clienteCpf,
      priceList: "varejo",
      lines: [{ skuId: ids.skuKit, codigo: "KIT-ATACADO-10", nome: "Kit atacado 10 peças", qty: 1, unit: 19900 }],
    },
    {
      id: "ped_entregue",
      status: "entregue",
      customer: ids.clienteCnpj,
      priceList: "atacado",
      lines: [{ skuId: ids.skuKit, codigo: "KIT-ATACADO-10", nome: "Kit atacado 10 peças", qty: 10, unit: 14900 }],
    },
    {
      id: "ped_cancelado",
      status: "cancelado",
      customer: ids.clienteCpf,
      priceList: "varejo",
      lines: [{ skuId: ids.skuCamiseta, codigo: "CAMISETA-BASICA", nome: "Camiseta básica", qty: 1, unit: 5990 }],
    },
  ];

  const pathTo: Record<SeedOrder["status"], Array<SeedOrder["status"] | null>> = {
    novo: [null, "novo"],
    confirmado: [null, "novo", "confirmado"],
    separando: [null, "novo", "confirmado", "separando"],
    despachado: [null, "novo", "confirmado", "separando", "despachado"],
    entregue: [null, "novo", "confirmado", "separando", "despachado", "entregue"],
    cancelado: [null, "novo", "cancelado"],
  };

  for (const order of orders) {
    await prisma.order.create({
      data: {
        id: order.id,
        tenantId: TENANT,
        customerUserId: order.customer,
        sellerUserId: ids.vendedor,
        channel: "loja",
        priceList: order.priceList,
        status: order.status,
        lines: {
          create: order.lines.map((line, i) => ({
            id: `${order.id}_l${i}`,
            tenantId: TENANT,
            skuId: line.skuId,
            codigoSnapshot: line.codigo,
            nomeSnapshot: line.nome,
            qty: line.qty,
            unitPriceCentavos: line.unit,
            priceList: order.priceList,
          })),
        },
      },
    });

    const steps = pathTo[order.status];
    for (let i = 1; i < steps.length; i++) {
      await prisma.orderStatusHistory.create({
        data: {
          id: `${order.id}_h${i}`,
          tenantId: TENANT,
          orderId: order.id,
          fromStatus: steps[i - 1],
          toStatus: steps[i] as SeedOrder["status"],
          actorUserId: i === 1 ? order.customer : ids.vendedor,
        },
      });
    }
  }

  await prisma.inventoryMovement.createMany({
    data: [
      { id: "mov_res_cam_conf", tenantId: TENANT, skuId: ids.skuCamiseta, orderId: "ped_confirmado", type: "reserve", deltaOnHand: 0, deltaReserved: 3, actorUserId: ids.vendedor },
      { id: "mov_res_esg_conf", tenantId: TENANT, skuId: ids.skuEsgotado, orderId: "ped_confirmado", type: "reserve", deltaOnHand: 0, deltaReserved: 2, actorUserId: ids.vendedor },
      { id: "mov_res_cam_sep", tenantId: TENANT, skuId: ids.skuCamiseta, orderId: "ped_separando", type: "reserve", deltaOnHand: 0, deltaReserved: 2, actorUserId: ids.vendedor },
      { id: "mov_res_kit_desp", tenantId: TENANT, skuId: ids.skuKit, orderId: "ped_despachado", type: "reserve", deltaOnHand: 0, deltaReserved: 1, actorUserId: ids.vendedor },
      { id: "mov_con_kit_desp", tenantId: TENANT, skuId: ids.skuKit, orderId: "ped_despachado", type: "consume", deltaOnHand: -1, deltaReserved: -1, actorUserId: ids.estoque },
      { id: "mov_res_kit_ent", tenantId: TENANT, skuId: ids.skuKit, orderId: "ped_entregue", type: "reserve", deltaOnHand: 0, deltaReserved: 10, actorUserId: ids.vendedor },
      { id: "mov_con_kit_ent", tenantId: TENANT, skuId: ids.skuKit, orderId: "ped_entregue", type: "consume", deltaOnHand: -10, deltaReserved: -10, actorUserId: ids.estoque },
    ],
  });

  await prisma.notificationOutbox.createMany({
    data: [
      {
        id: "out_email_cust",
        tenantId: TENANT,
        orderId: "ped_confirmado",
        channel: "email",
        recipientRole: "customer",
        recipient: "cliente.cpf@demo.local",
        templateKey: "pedido.status_alterado",
        payloadJson: JSON.stringify({ order_id: "ped_confirmado", status: "confirmado" }),
        status: "enviado",
      },
      {
        id: "out_email_seller",
        tenantId: TENANT,
        orderId: "ped_confirmado",
        channel: "email",
        recipientRole: "seller",
        recipient: "vendedor@demo.local",
        templateKey: "pedido.status_alterado",
        payloadJson: JSON.stringify({ order_id: "ped_confirmado", status: "confirmado" }),
        status: "enviado",
      },
      {
        id: "out_wa_cust",
        tenantId: TENANT,
        orderId: "ped_confirmado",
        channel: "whatsapp",
        recipientRole: "customer",
        recipient: "+5511999990001",
        templateKey: "pedido.status_alterado",
        payloadJson: JSON.stringify({ order_id: "ped_confirmado", status: "confirmado" }),
        status: "enviado",
      },
      {
        id: "out_wa_seller",
        tenantId: TENANT,
        orderId: "ped_confirmado",
        channel: "whatsapp",
        recipientRole: "seller",
        recipient: "+5511999990002",
        templateKey: "pedido.status_alterado",
        payloadJson: JSON.stringify({ order_id: "ped_confirmado", status: "confirmado" }),
        status: "enviado",
      },
    ],
  });

  console.log("Seed demo ok. Senha: Demo@1234");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
