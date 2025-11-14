import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import jsPDF from 'jspdf'

// Динамический импорт html2canvas только при необходимости
let html2canvas
if (typeof window !== 'undefined') {
  import('html2canvas').then((module) => {
    html2canvas = module.default
  })
}

export default function Report() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('ecobalance_results')
    if (!saved) {
      navigate('/results')
      return
    }

    try {
      setResults(JSON.parse(saved))
    } catch (e) {
      console.error('Ошибка загрузки результатов:', e)
      navigate('/results')
    }
  }, [navigate])

  const getStatusColor = () => {
    if (!results) return 'gray'
    if (results.footprint > results.benchmark * 1.2) return 'red'
    if (results.footprint < results.benchmark * 0.9) return 'green'
    return 'yellow'
  }

  const getStatusText = () => {
    if (!results) return 'Не определен'
    if (results.footprint > results.benchmark * 1.2) return 'Высокий'
    if (results.footprint < results.benchmark * 0.9) return 'Низкий'
    return 'Средний'
  }

  const getStatusEmoji = () => {
    const status = getStatusColor()
    if (status === 'green') return '🟢'
    if (status === 'yellow') return '🟡'
    return '🔴'
  }

  const getSummaryText = () => {
    if (!results) return ''
    if (results.footprint > results.benchmark * 1.2) {
      return 'Уровень выбросов вашей компании выше среднего. Основной вклад — потребление энергии. Рекомендуется анализ энергоэффективности оборудования.'
    }
    if (results.footprint < results.benchmark * 0.9) {
      return 'Уровень выбросов вашей компании ниже среднего. Продолжайте работать над оптимизацией процессов для дальнейшего снижения.'
    }
    return 'Уровень выбросов вашей компании находится в пределах средних показателей отрасли. Есть потенциал для оптимизации.'
  }

  const downloadPDF = async () => {
    setLoading(true)
    try {
      // Убеждаемся, что html2canvas загружен
      if (!html2canvas && typeof window !== 'undefined') {
        const module = await import('html2canvas')
        html2canvas = module.default
      }

      if (!html2canvas) {
        throw new Error('html2canvas не загружен')
      }

      const element = document.getElementById('report-content')
      if (!element) {
        throw new Error('Элемент отчёта не найден')
      }

      // Показываем элемент для захвата с правильным позиционированием
      const originalDisplay = element.style.display
      const originalPosition = element.style.position
      const originalLeft = element.style.left
      const originalTop = element.style.top
      const originalWidth = element.style.width
      const originalZIndex = element.style.zIndex

      element.style.display = 'block'
      element.style.position = 'relative'
      element.style.left = '0'
      element.style.top = '0'
      element.style.width = '800px' // Фиксированная ширина для консистентности
      element.style.zIndex = '9999'
      element.style.backgroundColor = 'white'

      // Ждём небольшую задержку для рендеринга
      await new Promise((resolve) => setTimeout(resolve, 100))

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      })

      // Восстанавливаем оригинальные стили
      element.style.display = originalDisplay
      element.style.position = originalPosition
      element.style.left = originalLeft
      element.style.top = originalTop
      element.style.width = originalWidth
      element.style.zIndex = originalZIndex

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const margin = 15 // Отступы по краям
      const contentWidth = pdfWidth - 2 * margin

      // Получаем размеры canvas
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      // Конвертируем пиксели в мм (96 DPI = 0.264583 мм на пиксель)
      const pxToMm = 0.264583
      const imgWidthMm = imgWidth * pxToMm
      const imgHeightMm = imgHeight * pxToMm

      // Рассчитываем масштаб для вписывания в ширину страницы
      const scale = contentWidth / imgWidthMm
      const scaledHeightMm = imgHeightMm * scale

      // Высота одной страницы без отступов
      const pageHeight = pdfHeight - 2 * margin

      // Рассчитываем количество страниц
      const totalPages = Math.ceil(scaledHeightMm / pageHeight)

      // Разбиваем на страницы
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage()
        }

        // Рассчитываем позицию и размер для этой страницы
        const sourceY = (imgHeight / totalPages) * i
        const sourceHeight = Math.min(
          imgHeight / totalPages,
          imgHeight - sourceY
        )

        // Высота в мм для этой части
        const pageImgHeightMm = (sourceHeight * pxToMm) * scale

        // Создаём временный canvas для этой страницы
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = imgWidth
        pageCanvas.height = Math.ceil(sourceHeight)
        const pageCtx = pageCanvas.getContext('2d')

        // Заполняем белым фоном
        pageCtx.fillStyle = '#ffffff'
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)

        // Копируем часть исходного canvas
        pageCtx.drawImage(
          canvas,
          0,
          Math.floor(sourceY),
          imgWidth,
          Math.ceil(sourceHeight),
          0,
          0,
          imgWidth,
          Math.ceil(sourceHeight)
        )

        const pageImgData = pageCanvas.toDataURL('image/png', 1.0)

        // Добавляем изображение на страницу
        pdf.addImage(
          pageImgData,
          'PNG',
          margin,
          margin,
          contentWidth,
          pageImgHeightMm
        )
      }

      pdf.save(`ecobalance-report-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Ошибка генерации PDF:', error)
      alert('Ошибка при создании PDF. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  const sendEmail = () => {
    const subject = encodeURIComponent('Отчёт EcoBalance - Расчёт углеродного следа')
    const body = encodeURIComponent(
      `Отчёт о расчёте углеродного следа продукта.\n\n` +
        `Продукт: ${results?.data?.product?.name || 'Не указан'}\n` +
        `Углеродный след: ${results?.footprint || 0} кг CO₂-экв./т\n\n` +
        `Сгенерировано системой EcoBalance`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  if (!results) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">Загрузка...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Отчёт и вывод результата</h1>
          <p className="text-gray-600">Итоговый отчёт по расчёту углеродного следа</p>
        </div>

        {/* Status Card */}
        <div className="card mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ваш углеродный след рассчитан</h2>
          <div className="mb-6">
            <div className="text-6xl mb-4">{getStatusEmoji()}</div>
            <div
              className={`inline-block px-6 py-3 rounded-lg text-xl font-bold mb-4 ${
                getStatusColor() === 'green'
                  ? 'bg-green-100 text-green-800'
                  : getStatusColor() === 'yellow'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {getStatusText()} ({getStatusText() === 'Высокий' ? '> 20% от среднего' : getStatusText() === 'Низкий' ? '< среднеотраслевого' : 'Средний'})
            </div>
          </div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">{getSummaryText()}</p>
        </div>

        {/* Report Content for PDF - Optimized for PDF generation */}
        <div
          id="report-content"
          className="bg-white"
          style={{
            display: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '800px',
            minHeight: '100vh',
            padding: '40px',
            fontSize: '14px',
            lineHeight: '1.6',
            fontFamily: 'Arial, sans-serif',
            color: '#1f2937',
            backgroundColor: '#ffffff',
            zIndex: -9999,
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px', pageBreakAfter: 'avoid' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937', marginBottom: '10px' }}>
              EcoBalance
            </h1>
            <p style={{ fontSize: '18px', color: '#4b5563' }}>Отчёт о расчёте углеродного следа</p>
          </div>

          {/* Company Info */}
          <div style={{ borderTop: '2px solid #d1d5db', borderBottom: '2px solid #d1d5db', padding: '30px 0', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '20px', color: '#111827' }}>
              Информация о компании
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>
              <p style={{ margin: 0 }}><strong>Компания:</strong> {user?.company?.name || 'Не указана'}</p>
              <p style={{ margin: 0 }}><strong>Отрасль:</strong> {user?.company?.industry || 'Не указана'}</p>
              <p style={{ margin: 0 }}><strong>Размер:</strong> {user?.company?.size || 'Не указан'}</p>
              <p style={{ margin: 0 }}><strong>Регион:</strong> {user?.company?.region || 'Не указан'}</p>
            </div>
          </div>

          {/* Product Info */}
          <div style={{ borderBottom: '2px solid #d1d5db', padding: '30px 0', marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '20px', color: '#111827' }}>
              Информация о продукте
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>
              <p style={{ margin: 0 }}><strong>Продукт:</strong> {results.data.product?.name || 'Не указан'}</p>
              <p style={{ margin: 0 }}><strong>Сырьё:</strong> {results.data.rawMaterial?.name || 'Не указано'}</p>
              <p style={{ margin: 0 }}><strong>Расход сырья:</strong> {results.data.rawMaterialAmount || 'Не указано'} т/т</p>
              <p style={{ margin: 0 }}><strong>Электроэнергия:</strong> {results.data.electricity || 'Не указано'} МВт·ч/т</p>
            </div>
          </div>

          {/* Results */}
          <div style={{ borderBottom: '2px solid #d1d5db', padding: '30px 0', marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '20px', color: '#111827' }}>
              Результаты расчёта
            </h2>

            <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                Общий углеродный след (Scope 1-3)
              </p>
              <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                {results.footprint}
              </p>
              <p style={{ fontSize: '16px', color: '#4b5563' }}>кг CO₂-экв./т продукта</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
                Вклад компонентов:
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {results.breakdown.map((item, index) => (
                  <li key={item.name} style={{ fontSize: '14px', color: '#374151', paddingLeft: '20px', lineHeight: '1.7', margin: 0 }}>
                    • {item.name}: {item.value} кг CO₂ ({item.percentage}%)
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Сравнение с бенчмарком</p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                Ваш показатель: {results.footprint} кг CO₂/т
              </p>
              <p style={{ fontSize: '16px', color: '#374151', marginBottom: '4px' }}>
                Средний по отрасли: {results.benchmark} кг CO₂/т
              </p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: results.footprint > results.benchmark ? '#dc2626' : '#16a34a' }}>
                {results.footprint > results.benchmark ? '+' : ''}
                {results.benchmarkDiff.toFixed(1)}% от среднего
              </p>
            </div>
          </div>

          {/* Recommendations */}
          {results.recommendations && results.recommendations.length > 0 && (
            <div style={{ borderBottom: '2px solid #d1d5db', padding: '30px 0', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', color: '#111827' }}>
                Рекомендации по снижению выбросов
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {results.recommendations.map((rec, index) => (
                  <li
                    key={rec.id || index}
                    style={{
                      borderLeft: '4px solid #22c55e',
                      paddingLeft: '20px',
                      paddingTop: '8px',
                      paddingBottom: '8px',
                      pageBreakInside: 'avoid',
                      marginBottom: '4px',
                    }}
                  >
                    <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: '#111827', lineHeight: '1.4' }}>
                      {rec.title || 'Рекомендация'}
                    </h3>
                    {rec.action && (
                      <p style={{ fontSize: '14px', color: '#374151', marginBottom: '12px', lineHeight: '1.7', paddingRight: '10px' }}>
                        <strong>Действие:</strong> {rec.action}
                      </p>
                    )}
                    {rec.expectedReduction && (
                      <p style={{ fontSize: '14px', color: '#16a34a', fontWeight: '600', marginBottom: '10px', lineHeight: '1.6' }}>
                        <strong>Ожидаемое снижение:</strong> -{rec.expectedReduction.percentage?.toFixed(1) || 0}% ({' '}
                        {rec.expectedReduction.absolute || 0} {rec.expectedReduction.unit || 'кг CO₂-экв./т'})
                      </p>
                    )}
                    {rec.explanation && (
                      <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '10px', lineHeight: '1.7', paddingRight: '10px' }}>
                        <strong>Как это работает:</strong> {rec.explanation}
                      </p>
                    )}
                    {rec.complexityLabel && (
                      <p style={{ fontSize: '13px', color: '#4b5563', marginTop: '8px', lineHeight: '1.6' }}>
                        <strong>Сложность:</strong> {rec.complexityLabel} | <strong>Окупаемость:</strong> {rec.payback || 'Не указана'}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#6b7280',
              paddingTop: '30px',
              borderTop: '2px solid #d1d5db',
              pageBreakInside: 'avoid',
            }}
          >
            <p style={{ marginBottom: '4px' }}>Дата формирования: {new Date().toLocaleDateString('ru-RU')}</p>
            <p style={{ marginBottom: '4px' }}>Версия методики: 1.0</p>
            <p style={{ marginTop: '8px', fontWeight: '500' }}>Сгенерировано системой EcoBalance</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={downloadPDF}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Генерация PDF...' : 'Скачать PDF'}
          </button>
          <button
            onClick={sendEmail}
            className="btn-secondary"
          >
            Отправить по email
          </button>
          <button
            onClick={() => navigate('/calculate')}
            className="btn-secondary"
          >
            Сравнить с другим продуктом
          </button>
        </div>

        {/* Web Version Preview */}
        <div className="card bg-gray-50">
          <h2 className="text-2xl font-semibold mb-6">Веб-версия отчёта</h2>
          <div className="bg-white p-6 rounded-lg">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{getStatusEmoji()}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Ваш углеродный след рассчитан</h3>
            </div>
            <div className="mb-6">
              <div
                className={`inline-block px-6 py-3 rounded-lg text-xl font-bold ${
                  getStatusColor() === 'green'
                    ? 'bg-green-100 text-green-800'
                    : getStatusColor() === 'yellow'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {getStatusText()}
              </div>
              <p className="mt-4 text-gray-700">{getSummaryText()}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">Общий след</p>
                <p className="text-2xl font-bold">{results.footprint} кг CO₂/т</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">Бенчмарк</p>
                <p className="text-2xl font-bold">{results.benchmark} кг CO₂/т</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">Отклонение</p>
                <p className={`text-2xl font-bold ${results.footprint > results.benchmark ? 'text-red-600' : 'text-green-600'}`}>
                  {results.footprint > results.benchmark ? '+' : ''}
                  {results.benchmarkDiff.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
