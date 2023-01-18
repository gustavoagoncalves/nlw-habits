// Framework nodejs
import fastify from "fastify";
// Mecanismo de segurança que diz quais aplicações podem acessar os dados desse backend
import cors from "@fastify/cors";
import { appRoutes } from "./lib/routes";

const app = fastify()

app.register(cors)
app.register(appRoutes)

app.listen({
    port: 3333,
}).then(() => {
    console.log('HTTP Server running!')
})