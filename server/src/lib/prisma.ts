// Acesso as tabelas do banco de dados criada com o prisma
import { PrismaClient} from "@prisma/client";

export const prisma = new PrismaClient({
    log: ['query']
})