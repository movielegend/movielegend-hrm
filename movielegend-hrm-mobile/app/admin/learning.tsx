import { Screen } from '../../src/components/Screen';
import { PageHeader } from '../../src/components/PageHeader';
import { ScreenContainer } from '../../src/components/ScreenContainer';

export default function LearningScreen() {
  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title="E-Learning" subtitle="Tính năng đang được phát triển" />
      </ScreenContainer>
    </Screen>
  );
}
