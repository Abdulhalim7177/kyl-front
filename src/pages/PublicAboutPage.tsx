import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  Landmark,
  Newspaper,
  ShieldCheck,
  Target,
  UsersRound,
  Vote,
} from 'lucide-react'

const exploreLinks = [
  {
    title: 'Meet your representatives',
    description: 'Browse elected leaders and candidates from the Presidency down to ward councils.',
    href: '/leaders',
    cta: 'Explore leaders',
    icon: UsersRound,
  },
  {
    title: 'Follow the election cycle',
    description: 'See the offices on the ballot, the candidates contesting them, and the timetable.',
    href: '/elections',
    cta: 'View elections',
    icon: Landmark,
  },
  {
    title: 'Read public opinion',
    description: 'Preview active polls and see how citizens are responding to the issues that matter.',
    href: '/polls',
    cta: 'Browse polls',
    icon: Vote,
  },
  {
    title: 'Understand the context',
    description: 'Read news, explainers, and updates from the Know Your Leaders editorial desk.',
    href: '/blogs',
    cta: 'Read stories',
    icon: Newspaper,
  },
]

export default function PublicAboutPage() {
  return (
    <div className="bg-[#f7f8f5]">
      <Helmet>
        <title>About Us | Know Your Leaders</title>
        <meta
          name="description"
          content="Learn about Know Your Leaders and our mission to make Nigerian political leadership clear, accessible, and accountable."
        />
      </Helmet>

      <section className="relative overflow-hidden bg-[#072b20] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-teal-300/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 right-4 text-[12rem] font-black leading-none text-white/[0.03] sm:text-[16rem]" aria-hidden="true">
          CIVIC
        </div>

        <div className="container relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-50 backdrop-blur">
              <Landmark className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
              About Know Your Leaders
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              A clearer view of <span className="text-emerald-300">who governs.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-emerald-50/75 sm:text-lg">
              Know Your Leaders is a civic platform built to make political leadership, elections, and
              public opinion easier to find, understand, and hold accountable.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { label: 'States + FCT', value: '37', icon: Landmark },
              { label: 'Office levels', value: '7', icon: UsersRound },
              { label: 'Public record', value: 'Open', icon: Eye },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-emerald-100/70">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{stat.label}</span>
                  </div>
                  <p className="mt-2 text-2xl font-extrabold leading-none text-white sm:text-3xl">{stat.value}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-gray-100 bg-white p-7 shadow-[0_4px_24px_rgb(0,0,0,0.04)] sm:p-10">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#146c4f]">
              <Target className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-[#146c4f]">Our mission</p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-gray-900">
              Build the most useful public record of political leadership.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">
              Democracy works better when citizens can find accurate information about the people who
              represent them. We bring leaders, candidates, parties, elections, and public opinion into
              one clear, accessible directory.
            </p>
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#f7f8f5] p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#146c4f]" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-gray-600">
                We organize public information around offices, constituencies, and election cycles — not
                around partisan talking points.
              </p>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-3xl border border-[#0b3d2c] bg-gradient-to-br from-[#072b20] via-[#0b3d2c] to-[#146c4f] p-7 text-white shadow-[0_4px_24px_rgb(0,0,0,0.06)] sm:p-10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '42px 42px' }} aria-hidden="true" />
            <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-300">
              <Eye className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="relative mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200/70">Our vision</p>
            <h2 className="relative mt-2 text-3xl font-extrabold leading-tight tracking-tight">
              A transparent future, with every voter better informed.
            </h2>
            <p className="relative mt-4 text-base leading-relaxed text-emerald-50/70">
              We imagine a society where every voter can make confident decisions at the polls, guided by
              a transparent record of leadership, political transitions, and public sentiment.
            </p>
            <div className="relative mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
              <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-emerald-50/70">
                From local councils to the Presidency, the full ladder of representation belongs in public view.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white/60">
        <div className="container mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#146c4f]">What you can do</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Explore the record from every angle.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
              The platform connects four parts of the civic picture: the people, the contests, the issues,
              and the context.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {exploreLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.title}
                  to={item.href}
                  className="group flex h-full flex-col rounded-3xl border border-gray-100 bg-white p-7 shadow-[0_4px_24px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#146c4f]/25 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-[#146c4f]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl font-extrabold tracking-tight text-gray-900 group-hover:text-[#146c4f]">
                    {item.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">{item.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#146c4f]">
                    {item.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-[#072b20] px-6 py-12 text-center text-white shadow-2xl sm:px-12 sm:py-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
              backgroundSize: '46px 46px',
            }}
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200/70">Get involved</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to know your leaders?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-emerald-50/70 sm:text-base">
              Explore upcoming elections, review the people already in office, or reach out to the team
              behind the public record.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/elections"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-6 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-200 sm:w-auto"
              >
                View elections <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/leaders"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15 sm:w-auto"
              >
                Browse leaders
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
