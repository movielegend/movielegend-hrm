import React from 'react';
import renderer from 'react-test-renderer';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders correctly with ACTIVE status', () => {
    const tree = renderer.create(<StatusBadge label="ACTIVE" />).toJSON() as any;
    expect(tree?.children?.[0]).toBe('ACTIVE');
  });

  it('renders correctly with INACTIVE status', () => {
    const tree = renderer.create(<StatusBadge label="INACTIVE" />).toJSON() as any;
    expect(tree?.children?.[0]).toBe('INACTIVE');
  });
});
