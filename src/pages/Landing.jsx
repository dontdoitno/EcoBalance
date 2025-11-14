import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'

export default function Landing() {
  const { user } = useAuth()

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              EcoBalance
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Инструмент для расчёта и снижения углеродного следа химических продуктов
            </p>
            <Link
              to={user ? '/calculate' : '/register'}
              className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-50 transition-colors shadow-xl hover:shadow-2xl"
            >
              {user ? 'Начать расчёт' : 'Попробовать бесплатно'}
            </Link>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Проблема</h2>
            <div className="w-24 h-1 bg-primary-600 mx-auto mb-8"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Компании сталкиваются с требованиями по ESG и декарбонизации, но у них нет простого инструмента для расчёта углеродного следа химических продуктов.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Решение</h2>
            <div className="w-24 h-1 bg-primary-600 mx-auto mb-8"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              EcoBalance помогает рассчитать углеродный след и получить персональные рекомендации по снижению выбросов.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Как это работает</h2>
            <div className="w-24 h-1 bg-primary-600 mx-auto mb-12"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Ввод данных</h3>
              <p className="text-gray-600">
                Выберите продукт и укажите данные о сырье, энергии и транспорте
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Автоматический расчёт</h3>
              <p className="text-gray-600">
                Система рассчитывает углеродный след по Scope 1-3 стандартам
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Отчёт и рекомендации</h3>
              <p className="text-gray-600">
                Получите детальный отчёт с визуализацией и практическими рекомендациями
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Пример расчёта</h2>
            <div className="w-24 h-1 bg-primary-600 mx-auto mb-8"></div>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="card bg-white shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Аммиак</h3>
                  <p className="text-gray-600">Базовая оценка углеродного следа</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600 mb-1">2400</div>
                  <div className="text-sm text-gray-500">кг CO₂/т</div>
                </div>
              </div>
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">После оптимизации</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-green-600">2112</span>
                    <span className="text-green-600 font-semibold">(-12%)</span>
                  </div>
                </div>
                <div className="mt-4 bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Готовы начать?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Присоединяйтесь к компаниям, которые уже используют EcoBalance для снижения углеродного следа
          </p>
          <Link
            to={user ? '/calculate' : '/register'}
            className="inline-block btn-primary text-lg px-8 py-4"
          >
            {user ? 'Войти в систему' : 'Попробовать бесплатно'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">E</span>
                </div>
                <span className="text-xl font-bold text-white">EcoBalance</span>
              </div>
              <p className="text-sm">
                Инструмент для расчёта и снижения углеродного следа химических продуктов
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Контакты</h4>
              <ul className="space-y-2 text-sm">
                <li>Email: info@ecobalance.ru</li>
                <li>Телефон: +7 (495) 123-45-67</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Правовая информация</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="#" className="hover:text-primary-400">Политика конфиденциальности</Link></li>
                <li><Link to="#" className="hover:text-primary-400">Условия использования</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 EcoBalance. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </Layout>
  )
}
