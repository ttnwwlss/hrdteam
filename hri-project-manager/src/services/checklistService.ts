import { roundService, RoundChecklistItem } from './roundService';
import { logService } from './logService';

export const checklistService = {
  /**
   * Retrieves the checklist of a specific round.
   */
  async getChecklist(roundId: string): Promise<RoundChecklistItem[]> {
    const round = await roundService.getRoundById(roundId);
    if (!round) return [];
    return round.checklist || [];
  },

  /**
   * Updates the entire checklist array of a round.
   */
  async updateChecklist(roundId: string, checklist: RoundChecklistItem[]): Promise<RoundChecklistItem[]> {
    const round = await roundService.getRoundById(roundId);
    if (!round) throw new Error('Round not found');

    const updatedRound = await roundService.updateRound(roundId, { checklist });
    return updatedRound.checklist;
  },

  /**
   * Toggles the completed status of an item.
   */
  async toggleChecklistItem(roundId: string, itemId: string): Promise<RoundChecklistItem[]> {
    const round = await roundService.getRoundById(roundId);
    if (!round) throw new Error('Round not found');

    const checklist = (round.checklist || []).map(item => {
      if (item.id === itemId) {
        const nextStatus = !item.completed;
        logService.logAction(
          'checklist',
          roundId,
          round.name,
          'update',
          `체크리스트 [${item.title}] 상태 변경: ${nextStatus ? '체크' : '해제'}`
        ).catch(err => console.error(err));
        return { ...item, completed: nextStatus };
      }
      return item;
    });

    const updated = await this.updateChecklist(roundId, checklist);
    return updated;
  },

  /**
   * Adds a new custom checklist item to the round.
   */
  async addChecklistItem(roundId: string, title: string): Promise<RoundChecklistItem[]> {
    const round = await roundService.getRoundById(roundId);
    if (!round) throw new Error('Round not found');

    const newItem: RoundChecklistItem = {
      id: 'chk_' + Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      completed: false
    };

    const checklist = [...(round.checklist || []), newItem];
    const updated = await this.updateChecklist(roundId, checklist);

    await logService.logAction(
      'checklist',
      roundId,
      round.name,
      'update',
      `체크리스트 새 항목 추가: [${title}]`
    );

    return updated;
  },

  /**
   * Removes a checklist item from the round.
   */
  async removeChecklistItem(roundId: string, itemId: string): Promise<RoundChecklistItem[]> {
    const round = await roundService.getRoundById(roundId);
    if (!round) throw new Error('Round not found');

    const targetItem = (round.checklist || []).find(it => it.id === itemId);
    const title = targetItem ? targetItem.title : '항목';

    const checklist = (round.checklist || []).filter(item => item.id !== itemId);
    const updated = await this.updateChecklist(roundId, checklist);

    await logService.logAction(
      'checklist',
      roundId,
      round.name,
      'update',
      `체크리스트 항목 삭제: [${title}]`
    );

    return updated;
  },

  /**
   * Modifies an item's title while avoiding Korean text composition breaking (composition input)
   * by taking complete text updates.
   */
  async updateChecklistItemTitle(roundId: string, itemId: string, newTitle: string): Promise<RoundChecklistItem[]> {
    const round = await roundService.getRoundById(roundId);
    if (!round) throw new Error('Round not found');

    const checklist = (round.checklist || []).map(item => {
      if (item.id === itemId) {
        return { ...item, title: newTitle };
      }
      return item;
    });

    const updated = await this.updateChecklist(roundId, checklist);
    return updated;
  }
};
