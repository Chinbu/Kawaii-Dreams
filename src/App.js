import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';

// Firebase Config (Use .env in production: process.env.REACT_APP_FIREBASE_*)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Bot Username for Share Links
const BOT_USERNAME = '@Kawaii_dreams_bot';

function App() {
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [adsWatched, setAdsWatched] = useState(0); // Per post/session
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(true);
  const [idleTimer, setIdleTimer] = useState(null);

  // Embedded CSS (Tailwind + Custom)
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body {
      margin: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f3f4f6;
    }
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      color: white;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .card {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }
    .card img {
      width: 100%;
      height: 180px;
      object-fit: cover;
      border-bottom: 1px solid #e5e7eb;
    }
    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }
    .card-desc {
      color: #4b5563;
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: 1rem;
    }
    .btn {
      width: 100%;
      padding: 0.75rem;
      border-radius: 0.5rem;
      font-weight: 500;
      color: white;
      transition: background-color 0.2s ease, transform 0.2s ease;
    }
    .btn:disabled {
      background-color: #d1d5db;
      cursor: not-allowed;
    }
    .btn-green { background-color: #10b981; }
    .btn-green:hover:not(:disabled) { background-color: #059669; }
    .btn-blue { background-color: #3b82f6; }
    .btn-blue:hover:not(:disabled) { background-color: #2563eb; }
    .btn-purple { background-color: #8b5cf6; }
    .btn-purple:hover:not(:disabled) { background-color: #7c3aed; }
    .btn-indigo { background-color: #4f46e5; }
    .btn-indigo:hover:not(:disabled) { background-color: #4338ca; }
    .animate-fadeIn {
      animation: fadeIn 0.5s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fixed-tg-logo {
      position: fixed;
      bottom: 70px;
      right: 20px;
      z-index: 1000;
      animation: bounce 2s infinite;
    }
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      padding: 0.75rem;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      z-index: 999;
      font-size: 0.875rem;
      color: #4b5563;
    }
    .footer a {
      color: #3b82f6;
      font-weight: 500;
    }
  `;

  // Initialize Telegram WebApp
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      const startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
      if (startParam) {
        setSelectedPost(posts.find(p => p.id === startParam) || null);
      }
    }
  }, [posts]);

  // Fetch Posts from Firestore
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const allPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setPosts(allPosts);
        setFilteredPosts(allPosts);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to load posts');
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Reset adsWatched when selecting a new post
  useEffect(() => {
    setAdsWatched(0);
    setCountdown(0);
  }, [selectedPost]);

  // Search with Ad
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredPosts(posts);
      return;
    }
    try {
      await window.show_9906722(); // Rewarded interstitial
      const filtered = posts.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPosts(filtered);
      toast.success(filtered.length ? 'Search results loaded!' : 'No results found');
    } catch (error) {
      toast.error('Ad failed, try again');
    }
  };

  // Watch Ads Flow
  const handleWatchAd = async (post) => {
    if (countdown > 0) return;
    try {
      await window.show_9906722(); // Rewarded interstitial
      setAdsWatched(prev => prev + 1);
      toast('⏳ Wait for 3 seconds…', { autoClose: 2000 });
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (error) {
      toast.error('Ad failed, try again');
    }
  };

  // Check if Unlocked
  const isUnlocked = (post) => adsWatched >= post.adsRequired;

  // Download Redirect
  const handleDownload = (post) => {
    toast.success('✅ Ads completed! Download unlocked.');
    window.open(post.downloadLink, '_blank');
  };

  // Direct Link
  const handleDirectLink = (post) => {
    window.open(post.directLinkUrl, '_blank');
  };

  // Share Link
  const handleShare = (postId) => {
    const shareLink = `https://t.me/${BOT_USERNAME.replace('@', '')}?startapp=${postId}`;
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(shareLink);
    } else {
      navigator.clipboard.writeText(shareLink);
      toast.success('Share link copied!');
    }
  };

  // Auto Ads: 2 minutes idle
  useEffect(() => {
    const resetIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      const timer = setTimeout(() => {
        try {
          window.show_9906722('pop'); // Rewarded popup
          toast.info('Ad break! Keep engaging for more content.');
        } catch (error) {
          // Silent fail
        }
      }, 120000); // 2 min
      setIdleTimer(timer);
    };

    ['click', 'scroll', 'touchstart'].forEach(event => {
      window.addEventListener(event, resetIdle);
    });

    resetIdle();

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      ['click', 'scroll', 'touchstart'].forEach(event => {
        window.removeEventListener(event, resetIdle);
      });
    };
  }, [idleTimer]);

  // Update Filtered Posts on Query Change
  useEffect(() => {
    if (!searchQuery) {
      setFilteredPosts(posts);
    }
  }, [searchQuery, posts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        Loading...
      </div>
    );
  }

  const displayPosts = selectedPost ? [selectedPost] : filteredPosts;

  return (
    <div className="min-h-screen pt-20 pb-20">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {/* Header */}
      <header className="header">
        <h1>Kawaii Dreams</h1>
      </header>

      {/* Search Bar */}
      <div className="px-4 mb-6">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts by title..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={handleSearch}
            className="btn btn-blue"
          >
            Search
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {displayPosts.length ? (
            displayPosts.map(post => (
              <div key={post.id} className="card animate-fadeIn">
                <img src={post.imageUrl} alt={post.title} />
                <div className="p-4">
                  <h2 className="card-title">{post.title}</h2>
                  <p className="card-desc">{post.description}</p>
                  <div className="space-y-2">
                    {/* Watch Ads Button */}
                    {!isUnlocked(post) && (
                      <button
                        onClick={() => handleWatchAd(post)}
                        disabled={countdown > 0}
                        className="btn btn-green"
                      >
                        {countdown > 0 ? `Wait ${countdown}s` : `Watch ${post.adsRequired - adsWatched} Ads`}
                      </button>
                    )}
                    {/* Download Button */}
                    {isUnlocked(post) && (
                      <button
                        onClick={() => handleDownload(post)}
                        className="btn btn-blue"
                      >
                        Download
                      </button>
                    )}
                    {/* Get Direct Link Button */}
                    {post.directLinkEnabled && (
                      <button
                        onClick={() => handleDirectLink(post)}
                        className="btn btn-purple"
                      >
                        Get Direct Link
                      </button>
                    )}
                    {/* Share Button */}
                    <button
                      onClick={() => handleShare(post.id)}
                      className="btn btn-indigo"
                    >
                      Share
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center col-span-full text-gray-600">No posts found.</p>
          )}
        </div>
      </div>

      {/* Floating Telegram Logo */}
      <a href="https://t.me/Kawaii_dreams_bot" className="fixed-tg-logo">
        <img src="https://telegram.org/img/t_logo.png" alt="Telegram" className="w-12 h-12" />
      </a>

      {/* Footer */}
      <footer className="footer">
        <p>Made By XBI | <a href="https://t.me/Kawaii_dreams_bot" target="_blank" rel="noopener">Join Now</a></p>
      </footer>

      <ToastContainer position="bottom-left" autoClose={2000} theme="dark" />
    </div>
  );
}

export default App;
