import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'

export default function Landing() {
  const { user } = useAuth()

  return (
    <Layout>
      {/* Hero Section - Modern Design */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 mb-8 bg-primary-100 rounded-full text-primary-700 text-sm font-semibold backdrop-blur-sm border border-primary-200/50">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Экологичный подход к бизнесу
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-emerald-600 to-teal-600 leading-tight">
              EcoBalance
            </h1>

            <p className="text-xl md:text-2xl lg:text-3xl text-gray-700 mb-4 max-w-4xl mx-auto font-light leading-relaxed">
              Рассчитывайте и снижайте углеродный след
            </p>
            <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Профессиональный инструмент для химической отрасли с автоматическим расчётом по стандартам Scope 1–3
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to={user ? '/calculate' : '/register'}
                className="group relative px-8 py-4 bg-gradient-to-r from-primary-600 to-emerald-600 text-white rounded-xl font-semibold text-lg shadow-xl shadow-primary-500/50 hover:shadow-2xl hover:shadow-primary-500/50 transition-all duration-300 hover:scale-105 transform"
              >
                <span className="relative z-10 flex items-center">
                  {user ? 'Начать расчёт' : 'Попробовать бесплатно'}
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-emerald-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>

              <Link
                to="/login"
                className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-gray-50 transition-all duration-300 shadow-lg"
              >
                Уже есть аккаунт?
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="text-3xl font-bold text-primary-600 mb-2">Scope 1-3</div>
                <div className="text-gray-600">Полный расчёт выбросов</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="text-3xl font-bold text-primary-600 mb-2">100%</div>
                <div className="text-gray-600">Автоматизация расчётов</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="text-3xl font-bold text-primary-600 mb-2">24/7</div>
                <div className="text-gray-600">Доступ в любое время</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Problem Section - Modern Card Design */}
      <section className="relative py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold mb-4">
              Проблема
            </span>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              ESG-требования растут,
              <span className="block text-primary-600 mt-2">инструментов нет</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Компании сталкиваются с жёсткими требованиями по ESG и декарбонизации, но у них нет простого и точного инструмента для расчёта углеродного следа химических продуктов
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 border border-red-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute top-4 right-4 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Сложность расчёта</h3>
              <p className="text-gray-700 leading-relaxed">
                Традиционные методы расчёта требуют глубоких знаний методик и занимают недели
              </p>
            </div>

            <div className="group relative bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-8 border border-yellow-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute top-4 right-4 w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Нет стандартизации</h3>
              <p className="text-gray-700 leading-relaxed">
                Каждая компания рассчитывает по-своему, что затрудняет сравнение и аудит
              </p>
            </div>

            <div className="group relative bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute top-4 right-4 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Высокая стоимость</h3>
              <p className="text-gray-700 leading-relaxed">
                Привлечение внешних консультантов обходится дорого и требует времени на интеграцию
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section - Gradient Design */}
      <section className="relative py-24 bg-gradient-to-br from-primary-600 via-emerald-600 to-teal-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold mb-4 border border-white/30">
              Решение
            </span>
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              EcoBalance — ваш
              <span className="block mt-2">комплексный инструмент</span>
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Автоматизируйте расчёт углеродного следа, получайте персональные рекомендации по снижению выбросов и формируйте отчёты за минуты
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Точный расчёт</h3>
              <p className="text-white/90 leading-relaxed">
                Автоматический расчёт по международным стандартам Scope 1–3 с учётом всех источников выбросов
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Умные рекомендации</h3>
              <p className="text-white/90 leading-relaxed">
                Персональные рекомендации по снижению выбросов на основе анализа ваших процессов
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Готовые отчёты</h3>
              <p className="text-white/90 leading-relaxed">
                Формируйте профессиональные PDF-отчёты с визуализациями для руководства и аудиторов
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Экономия времени</h3>
              <p className="text-white/90 leading-relaxed">
                Сократите время на расчёты с недель до минут, освободив ресурсы для оптимизации
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Step Cards */}
      <section className="relative py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
              Процесс
            </span>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Как это работает
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Три простых шага к снижению углеродного следа
            </p>
          </div>

          <div className="relative">
            {/* Connection Line (Desktop) */}
            <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200"></div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {/* Step 1 */}
              <div className="relative group">
                <div className="relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-primary-600 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    1
                  </div>
                  <div className="mt-6 mb-6 w-16 h-16 bg-gradient-to-br from-primary-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Ввод данных</h3>
                  <p className="text-gray-600 leading-relaxed text-center">
                    Выберите продукт из обширной базы и укажите данные о сырье, энергии и транспорте. Интуитивный интерфейс делает процесс простым и быстрым.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    2
                  </div>
                  <div className="mt-6 mb-6 w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Автоматический расчёт</h3>
                  <p className="text-gray-600 leading-relaxed text-center">
                    Система мгновенно рассчитывает углеродный след по стандартам Scope 1–3, используя актуальные коэффициенты и методики расчёта.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    3
                  </div>
                  <div className="mt-6 mb-6 w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Отчёт и рекомендации</h3>
                  <p className="text-gray-600 leading-relaxed text-center">
                    Получите детальный отчёт с визуализациями, сравнением с бенчмарками и практическими рекомендациями по снижению выбросов.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section - Interactive Card */}
      <section className="relative py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
              Пример
            </span>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Реальный результат
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Посмотрите, как EcoBalance помогает снизить углеродный след
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-100 overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-200 rounded-full translate-y-1/2 -translate-x-1/2 opacity-20 blur-3xl"></div>

              <div className="relative">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                  <div className="mb-6 md:mb-0">
                    <div className="inline-flex items-center px-4 py-2 bg-primary-100 rounded-full text-primary-700 text-sm font-semibold mb-4">
                      Химическая продукция
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Аммиак</h3>
                    <p className="text-gray-600 text-lg">Базовая оценка углеродного следа</p>
                  </div>
                  <div className="text-center md:text-right">
                    <div className="inline-block bg-gradient-to-br from-red-500 to-orange-500 text-white px-6 py-3 rounded-2xl shadow-lg">
                      <div className="text-4xl md:text-5xl font-bold mb-1">2400</div>
                      <div className="text-sm opacity-90">кг CO₂/т</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-100 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-700 font-semibold text-lg">После оптимизации с EcoBalance</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl md:text-4xl font-bold text-emerald-600">2112</span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-xl font-bold">-12%</span>
                    </div>
                  </div>
                  <div className="relative bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-400 via-primary-500 to-emerald-500 rounded-full" style={{ width: '88%' }}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-700">Экономия: 288 кг CO₂/т</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="text-sm text-gray-600 mb-1">Scope 1-2</div>
                    <div className="text-2xl font-bold text-gray-900">1900</div>
                    <div className="text-xs text-gray-500">кг CO₂/т</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="text-sm text-gray-600 mb-1">Scope 3</div>
                    <div className="text-2xl font-bold text-gray-900">500</div>
                    <div className="text-xs text-gray-500">кг CO₂/т</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <div className="text-sm text-emerald-700 mb-1">Снижение</div>
                    <div className="text-2xl font-bold text-emerald-600">-12%</div>
                    <div className="text-xs text-emerald-600">за год</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Gradient with Pattern */}
      <section className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Готовы начать?
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Присоединяйтесь к компаниям, которые уже используют EcoBalance для снижения углеродного следа и достижения ESG-целей
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to={user ? '/calculate' : '/register'}
              className="group relative px-8 py-4 bg-gradient-to-r from-primary-500 to-emerald-500 text-white rounded-xl font-semibold text-lg shadow-2xl shadow-primary-500/50 hover:shadow-primary-500/70 transition-all duration-300 hover:scale-105 transform"
            >
              <span className="relative z-10 flex items-center">
                {user ? 'Войти в систему' : 'Начать бесплатно'}
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>

            <Link
              to="/login"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border-2 border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              Войти в аккаунт
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Modern Design */}
      <footer className="relative bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">E</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">EcoBalance</span>
              </div>
              <p className="text-gray-600 mb-6 max-w-md leading-relaxed">
                Профессиональный инструмент для расчёта и снижения углеродного следа химических продуктов
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-primary-100 hover:text-primary-600 transition-colors" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-primary-100 hover:text-primary-600 transition-colors" aria-label="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-4.138 1.16-.52-.588-1.23-.951-2.032-.951-2.532 0-4.584 2.049-4.584 4.584v.355a13.03 13.03 0 01-9.441-4.782 13.03 13.03 0 00-.621 2.273c0 1.57.799 2.956 2.014 3.766a4.958 4.958 0 01-2.076-.571v.057c0 2.22 1.58 4.073 3.676 4.494a4.979 4.979 0 01-2.068.08 4.586 4.586 0 004.282 3.181 9.22 9.22 0 01-5.69 1.96c-.369 0-.732-.021-1.09-.064a13.003 13.003 0 007.034 2.062c8.441 0 13.057-6.995 13.057-13.057 0-.198-.005-.396-.014-.593a9.336 9.336 0 002.285-2.384z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-primary-100 hover:text-primary-600 transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Продукт</h4>
              <ul className="space-y-3">
                <li><Link to="/register" className="text-gray-600 hover:text-primary-600 transition-colors">Регистрация</Link></li>
                <li><Link to="/login" className="text-gray-600 hover:text-primary-600 transition-colors">Вход</Link></li>
                <li><Link to="/calculate" className="text-gray-600 hover:text-primary-600 transition-colors">Расчёт</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Информация</h4>
              <ul className="space-y-3">
                <li><Link to="#" className="text-gray-600 hover:text-primary-600 transition-colors">Политика конфиденциальности</Link></li>
                <li><Link to="#" className="text-gray-600 hover:text-primary-600 transition-colors">Условия использования</Link></li>
                <li><Link to="#" className="text-gray-600 hover:text-primary-600 transition-colors">Контакты</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-600 text-sm">&copy; 2026 EcoBalance. Все права защищены.</p>
              <div className="mt-4 md:mt-0 flex items-center space-x-6 text-sm text-gray-600">
                <span>Email: info@ecobalance.ru</span>
                <span>Телефон: +7 (495) 123-45-67</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </Layout>
  )
}
