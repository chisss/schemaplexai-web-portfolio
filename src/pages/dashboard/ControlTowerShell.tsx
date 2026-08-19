import { Drawer, Grid } from 'antd';
import { useHomepageAggregate } from '@/api/homepage';
import { useHomepageStore } from '@/store/useHomepageStore';
import ControlBar from './components/ControlBar';
import PanelErrorBoundary from './components/PanelErrorBoundary';
import TaskPanel from './panels/TaskPanel';
import AIWorkbench from './panels/AIWorkbench';
import SituationPanel from './panels/SituationPanel';
import './ControlTowerShell.css';

const { useBreakpoint } = Grid;

export default function ControlTowerShell() {
  const screens = useBreakpoint();
  const { data, isLoading } = useHomepageAggregate();
  const rightPanelCollapsed = useHomepageStore((s) => s.rightPanelCollapsed);
  const toggleRightPanel = useHomepageStore((s) => s.toggleRightPanel);

  const isTablet = screens.md && !screens.xl;
  const isMobile = !screens.md;

  return (
    <section className="control-tower" aria-label="控制塔首页">
      <ControlBar />

      <div className="control-tower__grid">
        {/* 移动端：情境摘要优先 */}
        {isMobile && (
          <div className="control-tower__panel control-tower__panel--center" role="region" aria-label="AI 协同工作台">
            <PanelErrorBoundary panelName="AI 工作台">
              <AIWorkbench data={data} isLoading={isLoading} />
            </PanelErrorBoundary>
          </div>
        )}

        <div className="control-tower__panel control-tower__panel--left" role="region" aria-label="我的任务">
          <PanelErrorBoundary panelName="任务面板">
            <TaskPanel data={data?.taskPanel} isLoading={isLoading} />
          </PanelErrorBoundary>
        </div>

        {!isMobile && (
          <div className="control-tower__panel control-tower__panel--center" role="region" aria-label="AI 协同工作台">
            <PanelErrorBoundary panelName="AI 工作台">
              <AIWorkbench data={data} isLoading={isLoading} />
            </PanelErrorBoundary>
          </div>
        )}

        {!isTablet && !isMobile && (
          <div className="control-tower__panel control-tower__panel--right" role="region" aria-label="系统态势">
            <PanelErrorBoundary panelName="态势面板">
              <SituationPanel data={data?.situationPanel} isLoading={isLoading} />
            </PanelErrorBoundary>
          </div>
        )}
      </div>

      {/* 平板端：右栏作为抽屉 */}
      {isTablet && (
        <Drawer
          title="系统态势"
          placement="right"
          width={320}
          open={rightPanelCollapsed}
          onClose={toggleRightPanel}
        >
          <SituationPanel data={data?.situationPanel} isLoading={isLoading} />
        </Drawer>
      )}

      {/* 移动端：态势摘要放底部 */}
      {isMobile && (
        <div className="control-tower__panel control-tower__panel--right" role="region" aria-label="系统态势">
          <PanelErrorBoundary panelName="态势面板">
            <SituationPanel data={data?.situationPanel} isLoading={isLoading} compact />
          </PanelErrorBoundary>
        </div>
      )}
    </section>
  );
}
