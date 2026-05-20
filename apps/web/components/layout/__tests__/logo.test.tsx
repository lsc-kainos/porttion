import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from '../logo';

describe('<Logo />', () => {
  it('renderiza wordmark com texto Kainos', () => {
    render(<Logo />);
    expect(screen.getByText('Kainos')).toBeInTheDocument();
  });

  it('aceita className extra', () => {
    const { container } = render(<Logo className="ml-4" />);
    expect(container.firstChild).toHaveClass('ml-4');
  });
});
