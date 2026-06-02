import { memo } from 'react';
import Modal from '../common/Modal';

/**
 * TrailerModal – YouTube trailer player inside a modal.
 * Uses the reusable Modal component with a responsive 16:9 iframe.
 */
function TrailerModal({ videoKey, isOpen, onClose }) {
  if (!videoKey && isOpen) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Trailer" size="lg">
        <div className="trailer-container">
          <p className="trailer-unavailable">Trailer is not available.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trailer" size="lg">
      <div className="trailer-modal">
        <div className="trailer-container">
          <iframe
            className="trailer-iframe"
            src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0`}
            title="Video trailer"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </Modal>
  );
}

export default memo(TrailerModal);
