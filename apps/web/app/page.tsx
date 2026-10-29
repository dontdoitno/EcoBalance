import Link from "next/link";
import { MiniCalculator } from "@/components/landing/mini-calculator";

const STEPS = [
  {
    title: "Профиль и граница расчёта",
    body: "Компания, площадка, продукт, маршрут, функциональная единица и граница системы (cradle-to-gate, cradle-to-border для CBAM, cradle-to-grave).",
  },
  {
    title: "Сырьё, энергия, транспорт",
    body: "Scope 1, 2 и 3 по формулам LCA: топливо и технологические выбросы, электроэнергия и тепло, сырьё-прекурсоры, транспорт, отходы.",
  },
  {
    title: "Hotspots и качество данных",
    body: "Ранжирование статей по вкладу (Парето), флаги качества данных (доля первичных данных, неопределённость, демо-коэффициенты).",
  },
  {
    title: "Сценарий и отчёт",
    body: "Меры пересчитывают модель заново, не процент от потолка. Отчёт PCF (ISO 14067) и, если применимо, отчёт CBAM.",
  },
];

const STANDARDS = ["ISO 14040/14044", "ISO 14067:2018", "ГОСТ Р ИСО 14067-2021", "GHG Protocol", "ISO 14064-1", "TfS PCF Guideline"];

const FAQ = [
  {
    q: "Коэффициенты выбросов в демо: настоящие?",
    a: "Нет. Все коэффициенты в текущей версии помечены как демонстрационные (is_demo) и предназначены для проверки методики расчёта, а не для подачи в реальную CBAM-декларацию.",
  },
  {
    q: "Для каких продуктов формируется отчёт CBAM?",
    a: "Только для товаров из категорий CBAM (в текущем справочнике: аммиак, мочевина, сульфат аммония). Для остальных продуктов система прямо говорит «CBAM не применим» и предлагает PCF-отчёт по ISO 14067.",
  },
  {
    q: "Как считается эффект мер по снижению выбросов?",
    a: "Каждая мера меняет конкретные входные параметры модели (коэффициент электроэнергии, вид транспорта, долю сырья и т.д.), и система пересчитывает расчёт заново. Никаких фиксированных процентов снижения.",
  },
  {
    q: "Чем Scope 1 отличается от Scope 3 в химическом производстве?",
    a: "Scope 1, это сжигание топлива и технологические выбросы на площадке. Сырьё относится к Scope 3 (upstream): это типичная ошибка упрощённых калькуляторов, которую методика EcoBalance исправляет явно.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-bg">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-pill bg-accent text-sm font-medium text-accent-on">
              E
            </span>
            <span className="text-[15px] font-medium text-text">EcoBalance</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text">
              Войти
            </Link>
            <Link
              href="/register"
              className="rounded-pill bg-accent px-4 py-2 text-sm font-medium text-accent-on transition-colors duration-150 hover:brightness-110"
            >
              Начать бесплатно
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — a Reading: the number this tool exists to replace, struck,
          beside the number it produces instead. */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <h1 className="text-5xl font-medium leading-[1.05] tracking-[-0.03em] text-text sm:text-6xl">
              Встроенные выбросы вашей продукции, посчитанные точно, не взятые из default-таблицы CBAM
            </h1>
            <p className="mt-6 max-w-xl text-lg text-text-secondary">
              Российские экспортёры химической продукции платят за CBAM-сертификаты в 1,5, иногда в 2 раза больше,
              когда у импортёра нет верифицированных первичных данных. EcoBalance считает Scope 1, 2 и 3 по
              методике LCA/ISO 14067 и формирует отчёт CBAM за минуты.
            </p>
            <div className="mt-10 flex gap-4">
              <Link
                href="/register"
                className="rounded-pill bg-accent px-6 py-3 text-sm font-medium text-accent-on transition-colors duration-150 hover:brightness-110"
              >
                Рассчитать углеродный след
              </Link>
              <Link
                href="/login"
                className="rounded-pill border border-border-strong px-6 py-3 text-sm font-medium text-text hover:bg-bg-sunken"
              >
                Демо-доступ
              </Link>
            </div>
          </div>

          <div className="rounded-card border border-border bg-bg-raised p-8">
            <p className="text-sm text-text-secondary">Default-значение (без первичных данных)</p>
            <p className="mt-2 font-mono text-3xl tabular-nums text-text-faint line-through">
              6,0 т CO₂-экв./т
            </p>
            <div className="my-6 h-px bg-border" />
            <p className="text-sm text-text-secondary">По факту, через EcoBalance</p>
            <p className="mt-2 font-mono text-5xl tabular-nums text-accent">3,38 т CO₂-экв./т</p>
            <p className="mt-4 text-xs text-text-faint">
              аммиак, SMR · рассчитано ядром EcoBalance на демо-коэффициентах
            </p>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-b border-border bg-bg-sunken">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-3xl font-medium text-text">
            Без первичных данных: завышенные выбросы и завышенная стоимость квот
          </h2>
          <p className="mt-4 max-w-3xl text-text-secondary">
            Импортёр запрашивает данные о встроенных выбросах у экспортёра даже при продаже через
            посредника. Без ответа применяются default-значения, которые регулятор устанавливает
            заведомо выше фактических показателей: это прямые деньги, которые теряет экспортёр.
          </p>
          <div className="mt-10">
            <MiniCalculator />
          </div>
        </div>
      </section>

      {/* How it works — a trail, not icon cards */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-3xl font-medium text-text">Как это работает</h2>
          <div className="mt-10 border-t border-text">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-border py-6 sm:grid-cols-[2.5rem_14rem_1fr]"
              >
                <span className="font-mono text-sm text-text-faint">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="font-medium text-text">{step.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real example — a Reading */}
      <section className="border-b border-border bg-bg-sunken">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-3xl font-medium text-text">Реальный пример расчёта</h2>
          <p className="mt-3 max-w-2xl text-text-secondary">
            Аммиак, паровой риформинг природного газа (SMR). Числа ниже: реальный вывод расчётного
            ядра EcoBalance на демонстрационных коэффициентах, не иллюстрация.
          </p>
          <div className="mt-8 grid divide-y divide-border rounded-card border border-border bg-bg-raised sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <ExampleStat label="PCF (Scope 1, 2, 3)" value="3378,4" unit="кг CO₂-экв./т" />
            <ExampleStat label="Встроенные выбросы CBAM" value="3297,4" unit="кг CO₂-экв./т" />
            <ExampleStat
              label="После переключения на ВИЭ и ж/д"
              value="3248,4"
              unit="кг CO₂-экв./т (минус 3,8%)"
              accent
            />
          </div>
        </div>
      </section>

      {/* Standards */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <p className="text-sm text-text-faint">Методика основана на</p>
          <div className="mt-5 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {STANDARDS.map((standard) => (
              <span key={standard} className="font-mono text-sm text-text-secondary">
                {standard}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border bg-bg-sunken">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-3xl font-medium text-text">Вопросы</h2>
          <div className="mt-8 divide-y divide-border">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-text">
                  {item.q}
                  <span className="text-text-faint motion-safe:transition-transform motion-safe:duration-150 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h2 className="text-3xl font-medium text-text">Готовы посчитать свой продукт?</h2>
          <p className="mt-3 text-text-secondary">
            Регистрация занимает минуту. Первый расчёт, в быстром режиме, без заполнения всех разделов.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-block rounded-pill bg-accent px-6 py-3 text-sm font-medium text-accent-on transition-colors duration-150 hover:brightness-110"
          >
            Начать бесплатно
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-10 text-sm text-text-faint">
          © 2026 EcoBalance. Рабочий прототип. Коэффициенты выбросов в демо-версии иллюстративны.
        </div>
      </footer>
    </div>
  );
}

function ExampleStat({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
}) {
  return (
    <div className="p-8">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className={`mt-2 font-mono text-3xl tabular-nums ${accent ? "text-accent" : "text-text"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-text-faint">{unit}</p>
    </div>
  );
}
