import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResponsiveDialog } from '../responsive-dialog';

// Mock useMediaQuery para forçar caminho desktop/mobile.
vi.mock('@/hooks/shared/use-media-query', () => ({
  useMediaQuery: vi.fn(),
}));
import { useMediaQuery } from '@/hooks/shared/use-media-query';

describe('ResponsiveDialog', () => {
  it('renderiza Dialog quando viewport >= md', () => {
    (useMediaQuery as ReturnType<typeof vi.fn>).mockReturnValue(true);
    render(
      <ResponsiveDialog open onOpenChange={() => {}} title="Hello">
        <p>Body</p>
      </ResponsiveDialog>,
    );
    // Dialog usa role="dialog"
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('renderiza Sheet quando viewport < md', () => {
    (useMediaQuery as ReturnType<typeof vi.fn>).mockReturnValue(false);
    render(
      <ResponsiveDialog open onOpenChange={() => {}} title="Hello">
        <p>Body</p>
      </ResponsiveDialog>,
    );
    // Sheet usa data-state e role="dialog" também; checa por data attribute específico
    const node = screen.getByRole('dialog');
    expect(node.getAttribute('data-side')).toBe('bottom');
  });
});
