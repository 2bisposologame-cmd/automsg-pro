import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Zap,
  Clock,
  CheckCircle,
  MessageSquare,
  FileText,
  TrendingUp,
  Users,
  Star,
  Quote,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-200">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FlowDesk AI</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="#resultados" className="font-medium text-gray-600 hover:text-gray-900">
              Resultados
            </Link>
            <Link href="#funcionalidades" className="font-medium text-gray-600 hover:text-gray-900">
              Funcionalidades
            </Link>
            <Link href="#depoimentos" className="font-medium text-gray-600 hover:text-gray-900">
              Depoimentos
            </Link>
            <Link href="#precos" className="font-medium text-gray-600 hover:text-gray-900">
              Preços
            </Link>
            <Link href="/login" className="font-medium text-gray-600 hover:text-gray-900">
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              Começar Grátis →
            </Link>
          </nav>
          <Link
            href="/cadastro"
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white md:hidden"
          >
            Começar
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50" />
          <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="container relative mx-auto px-4 py-20 md:py-32">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                <TrendingUp className="h-4 w-4" />
                <span>+40% mais vendas em média</span>
              </div>

              <h1 className="mb-6 text-4xl font-bold leading-tight text-gray-900 md:text-6xl">
                Responda clientes em <span className="text-blue-600">5 segundos</span>{' '}
                <br className="hidden md:block" />e{' '}
                <span className="text-blue-600">feche mais vendas</span> no automático
              </h1>

              <p className="mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-gray-600 md:text-2xl">
                Sua cliente manda mensagem às 23h perguntando sobre preço.
                <strong className="text-gray-900"> Você responde instantaneamente.</strong> Enquanto
                dorme, sua IA qualifica leads e gera orçamentos.
                <br />
                <span className="text-lg text-gray-500">
                  Quanto você deixou de ganhar essa semana por não responder rápido?
                </span>
              </p>

              <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/cadastro"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-blue-200 transition hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-300"
                >
                  Criar conta grátis agora
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="#demo"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-8 py-4 text-lg font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Ver como funciona
                </Link>
              </div>

              <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6 rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-lg backdrop-blur md:grid-cols-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">5s</div>
                  <div className="text-sm text-gray-500">Tempo de resposta</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">24/7</div>
                  <div className="text-sm text-gray-500">Atendimento ativo</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">+40%</div>
                  <div className="text-sm text-gray-500">Mais conversões</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">100%</div>
                  <div className="text-sm text-gray-500"> IA treinada</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="resultados" className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                O problema que você já conhece
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-600">
                Provavelmente você já perdeu clientes assim...
              </p>
            </div>

            <div className="mx-auto mb-16 grid max-w-5xl gap-8 md:grid-cols-3">
              <div className="rounded-2xl border border-red-100 bg-white p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">Resposta demorada</h3>
                <p className="text-gray-600">
                  Você demora 2 horas para responder. O cliente já comprou do concorrente.
                </p>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-white p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                  <MessageSquare className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Sempre a mesma pergunta
                </h3>
                <p className="text-gray-600">
                  "Qual o preço?", "Horário de funcionamento?" — 20x por dia a mesma coisa.
                </p>
              </div>

              <div className="rounded-2xl border border-yellow-100 bg-white p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">Orçamento perdido</h3>
                <p className="text-gray-600">
                  "Manda o orçamento" — você perde 30min formatando. Cliente some.
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-white">
                <Zap className="h-6 w-6" />
                <span className="text-lg font-semibold">
                  FlowDesk AI resolve tudo isso — automaticamente
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="funcionalidades" className="bg-white py-20">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                Tudo que você precisa para vender mais
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-600">
                Configure em 5 minutos. Colha resultados para sempre.
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 transition-all hover:shadow-xl hover:shadow-blue-100">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-200">
                  <Bot className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">IA que responde por você</h3>
                <p className="mb-4 text-gray-600">
                  Sua assistente virtual responde dúvidas sobre preços, horários e serviços. 24
                  horas por dia, 7 dias por semana.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Respostas em 5 segundos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Treinada com seus serviços
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-green-100/50 p-8 transition-all hover:shadow-xl hover:shadow-green-100">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-green-600 shadow-lg shadow-green-200">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Orçamentos em 1 clique</h3>
                <p className="mb-4 text-gray-600">
                  Selecione os serviços, clique em gerar. Orçamento profissional pronto para enviar
                  em segundos.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Layout profissional
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Validade configurável
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-purple-100/50 p-8 transition-all hover:shadow-xl hover:shadow-purple-100">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-600 shadow-lg shadow-purple-200">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Acompanhe seus resultados</h3>
                <p className="mb-4 text-gray-600">
                  Dashboard com métricas de conversão, leads capturados e receitas geradas pelo
                  atendimento.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Métricas em tempo real
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Identifica perdas
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="depoimentos" className="bg-gradient-to-br from-blue-600 to-blue-800 py-20">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                Quem usa, recomenda
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-blue-100">
                Profissionais como você já estão aumentando suas vendas
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="mb-4 h-8 w-8 text-blue-300" />
                <p className="mb-6 text-lg text-white">
                  "Aumentei meu faturamento em 35% em 2 meses. A IA responde até quando estou no
                  meio de um procedimento. Perdia muitos clientes antes."
                </p>
                <div className="flex items-center gap-3">
                  <Image
                    src="https://i.pravatar.cc/100?img=5"
                    alt="Ana Martins"
                    width={48}
                    height={48}
                    className="rounded-full ring-2 ring-white/30"
                  />
                  <div>
                    <div className="font-semibold text-white">Ana Martins</div>
                    <div className="text-sm text-blue-200">Esteticista • São Paulo</div>
                  </div>
                </div>
                <div className="mt-4 border-t border-white/20 pt-4">
                  <div className="font-semibold text-green-400">+35% faturamento</div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="mb-4 h-8 w-8 text-blue-300" />
                <p className="mb-6 text-lg text-white">
                  "Minhas respostas agora são instantâneas. O paciente pergunta, a IA já responde
                  com o orçamento. Chego no consultório e já tenho a conversa pronta."
                </p>
                <div className="flex items-center gap-3">
                  <Image
                    src="https://i.pravatar.cc/100?img=12"
                    alt="Ricardo Santos"
                    width={48}
                    height={48}
                    className="rounded-full ring-2 ring-white/30"
                  />
                  <div>
                    <div className="font-semibold text-white">Ricardo Santos</div>
                    <div className="text-sm text-blue-200">Dentista • Rio de Janeiro</div>
                  </div>
                </div>
                <div className="mt-4 border-t border-white/20 pt-4">
                  <div className="font-semibold text-green-400">+50% agendamentos</div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="mb-4 h-8 w-8 text-blue-300" />
                <p className="mb-6 text-lg text-white">
                  "Trabalho de casa como designer. Atendo clientes o dia todo. Agora a IA faz o
                  trabalho pesado e eu só fecho negócios. Tempo livre doubling."
                </p>
                <div className="flex items-center gap-3">
                  <Image
                    src="https://i.pravatar.cc/100?img=9"
                    alt="Carla Ferreira"
                    width={48}
                    height={48}
                    className="rounded-full ring-2 ring-white/30"
                  />
                  <div>
                    <div className="font-semibold text-white">Carla Ferreira</div>
                    <div className="text-sm text-blue-200">Designer Freelancer • BH</div>
                  </div>
                </div>
                <div className="mt-4 border-t border-white/20 pt-4">
                  <div className="font-semibold text-green-400">+8h livres/semana</div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-white">
                <Users className="h-5 w-5" />
                <span>+500 profissionais já usam FlowDesk AI</span>
              </div>
            </div>
          </div>
        </section>

        <section id="precos" className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="mb-4 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                Invista no que traz resultado
              </h2>
              <p className="mx-auto mb-12 max-w-2xl text-xl text-gray-600">
                Menos que um café por dia para transformar seu atendimento
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl items-start gap-8 md:grid-cols-3">
              <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 transition hover:border-gray-300">
                <div className="mb-6">
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">Grátis</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">R$ 0</span>
                    <span className="text-gray-500">/mês</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Para testar e começar</p>
                </div>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                    50 mensagens/mês
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                    10 serviços cadastrados
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />1 usuário
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                    Dashboard básico
                  </li>
                </ul>
                <Link
                  href="/cadastro"
                  className="block rounded-xl bg-gray-100 py-3 text-center font-semibold text-gray-900 transition hover:bg-gray-200"
                >
                  Começar Grátis
                </Link>
              </div>

              <div className="relative transform rounded-2xl bg-blue-600 p-8 shadow-2xl shadow-blue-200 md:scale-105">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-yellow-400 px-4 py-1 text-sm font-bold text-yellow-900">
                  ⭐ Mais Popular
                </div>
                <div className="mb-6">
                  <h3 className="mb-1 text-lg font-semibold text-white">Pro</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">R$ 97</span>
                    <span className="text-blue-200">/mês</span>
                  </div>
                  <p className="mt-1 text-sm text-blue-200">Para profissionais sérios</p>
                </div>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-300" />
                    Mensagens <strong>ilimitadas</strong>
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-300" />
                    Serviços <strong>ilimitados</strong>
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-300" />3 usuários
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-300" />
                    Relatórios avançados
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-300" />
                    IA treinada personalizada
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-300" />
                    Prioridade no suporte
                  </li>
                </ul>
                <Link
                  href="/cadastro"
                  className="block rounded-xl bg-white py-3 text-center font-semibold text-blue-600 transition hover:bg-blue-50"
                >
                  Assinar Pro →
                </Link>
              </div>

              <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 transition hover:border-gray-300">
                <div className="mb-6">
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">Enterprise</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">R$ 297</span>
                    <span className="text-gray-500">/mês</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Para equipes e clínicas</p>
                </div>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                    Tudo do Pro
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                    Usuários <strong>ilimitados</strong>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                    API de integração
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                    Suporte prioritário 24/7
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                    Treinamento incluso
                  </li>
                </ul>
                <Link
                  href="#contato"
                  className="block rounded-xl bg-gray-900 py-3 text-center font-semibold text-white transition hover:bg-gray-800"
                >
                  Falar com Vendas
                </Link>
              </div>
            </div>

            <p className="mt-8 text-center text-gray-500">
              Todos os planos incluem 7 dias de teste gratuito do plano Pro
            </p>
          </div>
        </section>

        <section className="bg-gray-900 py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Pronto para vender mais sem fazer mais?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-400">
              Configure em 5 minutos. Veja resultados na primeira semana.
            </p>
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-10 py-4 text-lg font-semibold text-white shadow-xl shadow-blue-500/30 transition hover:bg-blue-600"
            >
              Criar minha conta grátis
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              Sem cartão de crédito • Configure em 5 min • Cancele quando quiser
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-gray-950 py-12 text-gray-400">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">FlowDesk AI</span>
            </div>
            <div className="flex gap-8 text-sm">
              <Link href="#" className="transition hover:text-white">
                Termos de Uso
              </Link>
              <Link href="#" className="transition hover:text-white">
                Privacidade
              </Link>
              <Link href="#" className="transition hover:text-white">
                Contato
              </Link>
              <Link href="#" className="transition hover:text-white">
                FAQ
              </Link>
            </div>
            <p className="text-sm">© 2026 FlowDesk AI. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
