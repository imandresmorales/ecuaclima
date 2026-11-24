import React, { useEffect, useId, useRef, useState } from 'react';
import { Bot, Database, Loader2, MessageCircle, Send, TriangleAlert, X } from 'lucide-react';
import { sendChatMessage } from '../api/chatApi';
import { useI18n } from '../i18n/I18nContext';
import { LOCALES } from '../i18n/translations';
import { describeWeatherCode } from '../utils/weatherCodes';

const MAX_MESSAGE_LENGTH = 500;
// Mensajes anteriores que se envían como contexto (para preguntas como "¿y mañana?")
const HISTORY_SIZE = 6;
const SUGGESTIONS = ['chat.suggestion.hottest', 'chat.suggestion.umbrella', 'chat.suggestion.coldest'];

/**
 * Recuadro "Datos usados": los datos de Open-Meteo que la IA consultó,
 * para que cualquiera pueda comprobar las cifras de la respuesta.
 */
const DataUsed = ({ sources, usage }) => {
  const { t, lang, formatNumber } = useI18n();
  if (!sources?.length) return null;

  const num = (value, decimals = 1) => (typeof value === 'number' ? formatNumber(value, decimals) : '–');
  const condition = (code) => t(describeWeatherCode(code).labelKey);
  const formatDate = (isoDate) =>
    new Intl.DateTimeFormat(LOCALES[lang], { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
      new Date(`${isoDate}T00:00:00Z`)
    );

  const describe = (source) => {
    if (source.type === 'current') {
      return [
        t('chat.sources.current', {
          place: source.place,
          temperature: num(source.temperature),
          feelsLike: num(source.feelsLike),
          humidity: num(source.humidity, 0),
          wind: num(source.windSpeed),
          condition: condition(source.weatherCode),
        }),
      ];
    }
    if (source.type === 'forecast') {
      return (source.days || []).map((day) =>
        t('chat.sources.forecastDay', {
          place: source.place,
          date: formatDate(day.date),
          max: num(day.max),
          min: num(day.min),
          rain: num(day.rainProbability, 0),
          condition: condition(day.weatherCode),
        })
      );
    }
    if (source.type === 'provinces' && source.hottest && source.coldest) {
      return [
        t(source.region ? 'chat.sources.provincesRegion' : 'chat.sources.provinces', {
          count: source.count,
          region: source.region ? t(`chat.region.${source.region}`) : '',
          hotCity: source.hottest.city,
          hotProvince: source.hottest.province,
          hotTemp: num(source.hottest.temperature),
          coldCity: source.coldest.city,
          coldProvince: source.coldest.province,
          coldTemp: num(source.coldest.temperature),
        }),
      ];
    }
    return [];
  };

  return (
    <div className="chat-sources">
      <p className="chat-sources-title">
        <Database size={14} aria-hidden="true" /> {t('chat.sources.title')}
      </p>
      <ul>
        {sources.flatMap(describe).map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
      {usage && (
        <p className="chat-sources-usage">
          {t('chat.sources.usage', { rounds: usage.rounds, tokens: num(usage.totalTokens, 0) })}
        </p>
      )}
    </div>
  );
};

const ChatMessage = ({ message }) => {
  const { t } = useI18n();

  if (message.role === 'user') return <div className="chat-msg chat-msg-user">{message.text}</div>;

  if (message.errorCode) {
    return (
      <div className="chat-msg chat-msg-assistant chat-msg-error" role="alert">
        {t(`chat.errors.${message.errorCode}`)}
      </div>
    );
  }

  return (
    <div className="chat-msg chat-msg-assistant">
      <p className="chat-msg-text">{message.text}</p>
      {!message.grounded && (
        <p className="chat-warning">
          <TriangleAlert size={14} aria-hidden="true" /> {t('chat.ungrounded')}
        </p>
      )}
      <DataUsed sources={message.sources} usage={message.usage} />
    </div>
  );
};

/**
 * Burbuja flotante con el asistente del clima.
 * La conversación vive solo en memoria: se pierde al recargar la página.
 */
const ChatWidget = () => {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);

  const nextId = useRef(0);
  const abortRef = useRef(null);
  const inputRef = useRef(null);
  const toggleRef = useRef(null);
  const endRef = useRef(null);
  const panelId = useId();
  const titleId = useId();
  const inputId = useId();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Mantiene visible el último mensaje
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages, loading]);

  // Cancela la petición pendiente si el componente se desmonta
  useEffect(() => () => abortRef.current?.abort(), []);

  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  const send = async (text) => {
    const message = text.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!message || loading) return;

    // Contexto: solo las preguntas respondidas con éxito y sus respuestas
    const history = messages
      .filter((m) => !m.errorCode && !m.failed)
      .slice(-HISTORY_SIZE)
      .map((m) => ({ role: m.role, text: m.text }));

    const userId = nextId.current++;
    setMessages((prev) => [...prev, { id: userId, role: 'user', text: message }]);
    setDraft('');
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const { reply, sources, grounded, usage } = await sendChatMessage(
        { message, history, lang },
        { signal: controller.signal }
      );
      setMessages((prev) => [...prev, { id: nextId.current++, role: 'assistant', text: reply, sources, grounded, usage }]);
    } catch (error) {
      if (controller.signal.aborted) return;
      setMessages((prev) => [
        ...prev.map((m) => (m.id === userId ? { ...m, failed: true } : m)),
        { id: nextId.current++, role: 'assistant', errorCode: error.code || 'CHAT_FAILED' },
      ]);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  };

  return (
    <div className="chat-widget">
      {open && (
        <section
          id={panelId}
          className="chat-panel glass"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              close();
            }
          }}
        >
          <header className="chat-header">
            <Bot size={22} aria-hidden="true" />
            <div className="chat-header-text">
              <h2 id={titleId}>{t('chat.title')}</h2>
              <p>{t('chat.subtitle')}</p>
            </div>
            <button type="button" className="chat-icon-btn" onClick={close} aria-label={t('chat.close')}>
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="chat-messages" role="log" aria-live="polite">
            <div className="chat-msg chat-msg-assistant">{t('chat.welcome')}</div>

            {messages.length === 0 && (
              <div className="chat-suggestions">
                {SUGGESTIONS.map((key) => (
                  <button key={key} type="button" onClick={() => send(t(key))}>
                    {t(key)}
                  </button>
                ))}
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {loading && (
              <div className="chat-msg chat-msg-assistant chat-typing" role="status">
                <Loader2 className="spinner" size={16} aria-hidden="true" /> {t('chat.thinking')}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            className="chat-form"
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
          >
            <label htmlFor={inputId} className="sr-only">
              {t('chat.inputLabel')}
            </label>
            <input
              id={inputId}
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t('chat.placeholder')}
              maxLength={MAX_MESSAGE_LENGTH}
              autoComplete="off"
            />
            <button type="submit" disabled={loading || !draft.trim()} aria-label={t('chat.send')}>
              <Send size={18} aria-hidden="true" />
            </button>
          </form>
          <p className="chat-disclaimer">{t('chat.disclaimer')}</p>
        </section>
      )}

      <button
        ref={toggleRef}
        type="button"
        className="chat-toggle"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? t('chat.close') : t('chat.open')}
      >
        {open ? <X size={26} aria-hidden="true" /> : <MessageCircle size={26} aria-hidden="true" />}
      </button>
    </div>
  );
};

export default ChatWidget;
