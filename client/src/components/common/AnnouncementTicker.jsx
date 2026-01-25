import { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import './AnnouncementTicker.css';

const AnnouncementTicker = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const { data } = await authAPI.getAnnouncements();
            setAnnouncements(data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (announcements.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % announcements.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [announcements.length]);

    if (loading) return null;

    const displayAnnouncements = announcements.length > 0
        ? announcements
        : [{ text: "Welcome to HostelEase! Management will post updates here soon." }];

    return (
        <div className="announcement-ticker">
            <div className="ticker-label">ANNOUNCEMENTS</div>
            <div className="ticker-content">
                <p key={currentIndex} className="ticker-text fade-in">
                    {displayAnnouncements[currentIndex].text || displayAnnouncements[currentIndex]}
                </p>
            </div>
        </div>
    );
};

export default AnnouncementTicker;
