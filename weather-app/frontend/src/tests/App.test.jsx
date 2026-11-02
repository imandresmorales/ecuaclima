import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('muestra la marca y el buscador', () => {
    render(<App />);
    expect(screen.getByText(/EcuaClima/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Escribe una ciudad y verás opciones/i)).toBeInTheDocument();
  });

  it('permite escribir en la barra de búsqueda', () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Escribe una ciudad y verás opciones/i);
    fireEvent.change(input, { target: { value: 'Loja' } });
    expect(input.value).toBe('Loja');
  });

  it('muestra la atribución de Open-Meteo', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Open-Meteo' })).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('cambia y recuerda el tema claro/oscuro', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Activar modo claro/i }));
    expect(document.body.classList.contains('light-mode')).toBe(true);
    expect(localStorage.getItem('ecuaclima-theme')).toBe('light');
  });
});
