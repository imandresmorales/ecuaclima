import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ChatWidget from '../components/ChatWidget';
import { I18nProvider, LANGUAGE_STORAGE_KEY } from '../i18n/I18nContext';
import { sendChatMessage, ChatError } from '../api/chatApi';

// Sin llamadas reales al servidor ni a la IA
vi.mock('../api/chatApi', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, sendChatMessage: vi.fn() };
});

const FORECAST_ANSWER = {
  reply: 'Sí, lleva paraguas: mañana hay 90 % de probabilidad de lluvia en Cuenca.',
  grounded: true,
  usage: { rounds: 3, toolCalls: 2, totalTokens: 1234 },
  sources: [
    {
      type: 'forecast',
      place: 'Cuenca',
      days: [{ date: '2026-11-25', max: 22.6, min: 10.6, rainProbability: 90, weatherCode: 95 }],
    },
  ],
};

const renderChat = () =>
  render(
    <I18nProvider>
      <ChatWidget />
    </I18nProvider>
  );

const openChat = () => fireEvent.click(screen.getByRole('button', { name: 'Abrir el asistente del clima' }));

const ask = (text) => {
  fireEvent.change(screen.getByLabelText('Escribe tu pregunta'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar pregunta' }));
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'es');
  sendChatMessage.mockReset();
});

describe('ChatWidget', () => {
  it('la burbuja abre el chat, enfoca el campo de texto y muestra sugerencias', () => {
    renderChat();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    openChat();

    expect(screen.getByRole('dialog', { name: 'Asistente del clima' })).toBeInTheDocument();
    expect(screen.getByLabelText('Escribe tu pregunta')).toHaveFocus();
    expect(screen.getByRole('button', { name: '¿Qué ciudad está más caliente ahora?' })).toBeInTheDocument();
  });

  it('envía la pregunta y muestra la respuesta con los datos usados', async () => {
    sendChatMessage.mockResolvedValue(FORECAST_ANSWER);
    renderChat();
    openChat();

    ask('¿Llevo paraguas mañana a Cuenca?');

    expect(await screen.findByText(FORECAST_ANSWER.reply)).toBeInTheDocument();
    expect(sendChatMessage).toHaveBeenCalledWith(
      { message: '¿Llevo paraguas mañana a Cuenca?', history: [], lang: 'es' },
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );

    const sources = screen.getByText('Datos usados (Open-Meteo)').closest('.chat-sources');
    expect(within(sources).getByText(/Cuenca, .*máx\. 22,6 °C, mín\. 10,6 °C, lluvia 90 %, Tormenta eléctrica/)).toBeInTheDocument();
    expect(within(sources).getByText(/3 consultas a la IA/)).toBeInTheDocument();
    expect(screen.queryByText(/Atención/)).not.toBeInTheDocument();
  });

  it('las sugerencias envían la pregunta con un clic', async () => {
    sendChatMessage.mockResolvedValue({ ...FORECAST_ANSWER, sources: [] });
    renderChat();
    openChat();

    fireEvent.click(screen.getByRole('button', { name: '¿Qué ciudad está más caliente ahora?' }));

    await screen.findByText(FORECAST_ANSWER.reply);
    expect(sendChatMessage.mock.calls[0][0].message).toBe('¿Qué ciudad está más caliente ahora?');
  });

  it('avisa cuando la respuesta tiene cifras que no están en los datos', async () => {
    sendChatMessage.mockResolvedValue({ reply: 'En Quito hay 40 °C.', grounded: false, sources: [], usage: null });
    renderChat();
    openChat();

    ask('¿Calor en Quito?');

    expect(await screen.findByText(/Atención: esta respuesta tiene cifras/)).toBeInTheDocument();
  });

  it('muestra el error traducido y no lo envía como contexto en la siguiente pregunta', async () => {
    sendChatMessage.mockRejectedValueOnce(new ChatError('RATE_LIMITED')).mockResolvedValueOnce(FORECAST_ANSWER);
    renderChat();
    openChat();

    ask('Primera pregunta');
    expect(await screen.findByRole('alert')).toHaveTextContent('Hiciste muchas preguntas seguidas');

    ask('Segunda pregunta');
    await screen.findByText(FORECAST_ANSWER.reply);
    expect(sendChatMessage.mock.calls[1][0].history).toEqual([]);
  });

  it('envía las respuestas anteriores como contexto', async () => {
    sendChatMessage.mockResolvedValue(FORECAST_ANSWER);
    renderChat();
    openChat();

    ask('¿Llueve en Cuenca?');
    await screen.findByText(FORECAST_ANSWER.reply);
    ask('¿Y mañana?');

    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(2));
    expect(sendChatMessage.mock.calls[1][0].history).toEqual([
      { role: 'user', text: '¿Llueve en Cuenca?' },
      { role: 'assistant', text: FORECAST_ANSWER.reply },
    ]);
  });

  it('Escape cierra el chat y devuelve el foco a la burbuja', () => {
    renderChat();
    openChat();

    fireEvent.keyDown(screen.getByLabelText('Escribe tu pregunta'), { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir el asistente del clima' })).toHaveFocus();
  });

  it('no envía preguntas vacías', () => {
    renderChat();
    openChat();
    expect(screen.getByRole('button', { name: 'Enviar pregunta' })).toBeDisabled();
    fireEvent.submit(screen.getByLabelText('Escribe tu pregunta').closest('form'));
    expect(sendChatMessage).not.toHaveBeenCalled();
  });
});
