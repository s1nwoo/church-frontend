import { useRef, useState } from 'react';
import { isBoardPosition } from './boardModel';

export default function usePieceDrag(place, onSelect, setSpecial) {
  const active = useRef(null);
  const [dragging, setDragging] = useState(false);
  function end() { active.current = null; setDragging(false); onSelect(null); }
  return {
    dragging,
    source(selection) {
      return { draggable: true, onDragStart(event) {
        active.current = selection;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', 'yut-piece');
        onSelect(selection.special ? null : selection); setDragging(true);
      }, onDragEnd: end };
    },
    target(position, team) {
      const accepts = () => active.current && (active.current.special
        ? isBoardPosition(position) : (team === undefined || active.current.team === team));
      return { onDragOver(event) {
        if (accepts()) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }
      }, onDrop(event) {
        if (!accepts()) return;
        event.preventDefault(); event.stopPropagation();
        if (active.current.special) setSpecial(active.current.special, position);
        else place(active.current, position);
        end();
      } };
    },
  };
}
