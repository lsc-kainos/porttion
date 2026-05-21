import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from '../logo';

describe('<Logo />', () => {
  it('renderiza wordmark com texto Porttion', () => {
    render(<Logo />);
    expect(screen.getByText('Porttion')).toBeInTheDocument();
  });

  it('aceita className extra', () => {
    const { container } = render(<Logo className="ml-4" />);
    expect(container.firstChild).toHaveClass('ml-4');
  });
});
