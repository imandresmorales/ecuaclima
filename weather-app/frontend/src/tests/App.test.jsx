import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('Debería renderizar la barra de búsqueda y el título del Navbar', () => {
    render(<App />);
    const heading = screen.getByText(/EcuClima/i);
    expect(heading).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Escribe una ciudad y verás opciones/i);
    expect(input).toBeInTheDocument();
  });

  it('Debería permitir escribir en la barra de búsqueda', () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Escribe una ciudad y verás opciones/i);
    fireEvent.change(input, { target: { value: 'Loja' } });
    expect(input.value).toBe('Loja');
  });
});
