import { Header } from './components/Header';
import './lib/dayjs';
import { SummaryTable } from './components/SummaryTable';
import './styles/global.css';
// import { Habit } from "./components/Habit";

export function App() {

  return (
    <div className='w-screen h-screen flex justify-center items-center'>
      
      <div className='w-full max-w-5xl px-6 flex flex-col gap-16'>

        <Header />
        <SummaryTable />

      </div>
    </div>
  )
}

// Componente: tudo aquilo que queremos REAPROVEITAR / ISOLAR
// Propriedade (props): uma informação enviada pra modificar um componente visual ou comportamental