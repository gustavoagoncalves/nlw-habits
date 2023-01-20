import { FastifyInstance } from "fastify"
import dayjs from "dayjs";

// Valida as informações e o tipo de dado que está sendo usado
import { z } from "zod";
import { prisma } from "./prisma"

export async function appRoutes(app: FastifyInstance) {
    /*
    * Método HTTP: Get (buscar informação), Post (criar algo), Put (atualizar algum recurso por completo), Patch (atualizar uma informação específica), Delete (deletar algum recurso)
    
    prisma --datasource-provider SQLite - cria um arquivo local de banco de dados, não precisando subir o banco de dados local.
    */
    app.post('/habits', async (request) => {
        //validando title e weekDays com o zod
        const createHabitBody = z.object({
            title: z.string(),
            weekDays: z.array(
                z.number().min(0).max(6)
            )
        })

        const { title, weekDays } = createHabitBody.parse(request.body)

        // Deixando o hábito criado disponível a partir do momento da criação com a biblioteca dayjs
        const today = dayjs().startOf('day').toDate()

        await prisma.habit.create({
            data: {
                title,
                created_at: today,
                weekDays: {
                    create: weekDays.map(weekDay => {
                        return {
                            week_day: weekDay,
                        }
                    })
                }
            }
        })
    })

    app.get('/day', async (request) => {
        const getDayParams = z.object({
            date: z.coerce.date()
        })

        const { date } = getDayParams.parse(request.query)
        
        const parsedDate = dayjs(date).startOf('day')
        const weekDay = parsedDate.get('day')

        // achar todos os hábitos possíveis dos dias
        // achar hábitos que já foram completados

        const possibleHabits = await prisma.habit.findMany({
            where: {
                created_at: {
                    lte: date,
                },
                weekDays: {
                    some: {
                        week_day: weekDay,
                    }
                }
            }
        })

        const day = await prisma.day.findUnique({
            where: {
                date: parsedDate.toDate(),
            },
            include: {
                dayHabits: true,
            }
        })

        const completedHabits = day?.dayHabits.map(dayHabit => {
            return dayHabit.habit_id
        })

        return {
            possibleHabits,
            completedHabits
        }
    })

    // Rota para marcar como completo ou incompleto um hábito
    app.patch('/habits/:id/toggle', async (request) => {
        // :id é chamado route param: parâmetro de identificação
        const toggleHabitParams = z.object({
            id: z.string().uuid(),
        })

        const { id } = toggleHabitParams.parse(request.params)

        const today = dayjs().startOf('day').toDate()

        let day = await prisma.day.findUnique({
            where: {
                date: today,
            }
        })

        if (!day) {
            day = await prisma.day.create({
                data: {
                    date: today,
                }
            })
        }

        //Buscando na tabela de day habit se o usuário já completou o hábito no dia
        const dayHabit = await prisma.dayHabit.findUnique({
            where: {
                day_id_habit_id: {
                    day_id: day.id,
                    habit_id: id,
                }
            }
        })

        if (dayHabit) {
            // Remover a marcação de completo se o registro já existir no banco de dados
            await prisma.dayHabit.delete({
                where: {
                    id: dayHabit.id,
                }
            })
        } else {
            // Completar o hábito no dia pela primeira vez
            await prisma.dayHabit.create({
                data: {
                    day_id: day.id,
                    habit_id: id,
                }
            })
        }

    })

    app.get('/summary', async () => {
        // Retornar um array com um resumo dos hábitos de vários dias
        // deve retornar ex: [ {date: 20/01, amount: 5, completed: 3 } {} ]
        // Query mais complexas, com mais condições, mais relacionamentos, temos que escrever o SQL na mão (RAW)

        const summary = await prisma.$queryRaw`
            SELECT
                D.id,
                D.date,
                (
                    SELECT
                        cast(count(*) as float)
                    FROM day_habits DH
                    WHERE DH.day_id = D.id
                ) as completed,
                (
                    SELECT
                        cast(count(*) as float)
                    FROM habit_week_days HWD
                    JOIN habits H
                        ON H.id = HWD.habit_id
                    WHERE
                        HWD.week_day = cast(strftime('%W', D.date/1000.0, 'unixepoch') as int)
                        AND H.created_at <= D.date
                ) as amount
            FROM days D
        `
        return summary
    })

}