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
}