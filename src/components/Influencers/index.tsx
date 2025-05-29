'use client';
import { Influencer } from '@/types/types';
import { CircularIcon, Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { CheckCircleSolid } from 'iconoir-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

// Extended interface to include subscription status
interface InfluencerWithSubscription extends Influencer {
  isSubscribed?: boolean;
  subscribers?: string[]; // Add subscribers array to the interface
}

export const Influencers = () => {
  const { data: session } = useSession();
  const [influencers, setInfluencers] = useState<InfluencerWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribingTo, setSubscribingTo] = useState<number | null>(null);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        const response = await fetch('/api/top-influencers');
        const data = await response.json();
        console.log("Top Influencers: ", data);
        
        // Map through influencers and check subscription status
        const influencersWithSubscriptionStatus = (data.influencers || []).map((influencer: InfluencerWithSubscription) => ({
          ...influencer,
          isSubscribed: session?.user?.username ? 
            influencer.subscribers?.includes(session.user.username) || false : 
            false
        }));
        
        setInfluencers(influencersWithSubscriptionStatus);
      } catch (error) {
        console.error('Error fetching influencers:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have session data or if session is null (to handle logged out state)
    if (session !== undefined) {
      fetchInfluencers();
    }
  }, [session]); // Re-fetch when session changes

  const handleSubscribe = async (influencerId: number, influencerName: string) => {
    if (!session) {
      setSubscriptionMessage('Please log in to subscribe');
      return;
    }

    setSubscribingTo(influencerId);
    setSubscriptionMessage(null);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          influencerId,
          username: session.user?.username
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`Successfully subscribed to ${influencerName}`);
        setSubscriptionMessage(`Successfully subscribed to @${influencerName}!`);

        // Update the local state to reflect subscription
        setInfluencers(prevInfluencers =>
          prevInfluencers.map(influencer =>
            influencer.id === influencerId
              ? { 
                  ...influencer, 
                  isSubscribed: true,
                  subscribers: [...(influencer.subscribers || []), session.user?.username || '']
                }
              : influencer
          )
        );
      } else {
        console.error('Subscription failed:', result.error);
        setSubscriptionMessage(result.error || 'Subscription failed');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      setSubscriptionMessage('Network error. Please try again.');
    } finally {
      setSubscribingTo(null);
      // Clear message after 3 seconds
      setTimeout(() => setSubscriptionMessage(null), 3000);
    }
  };

  const getButtonStyle = (isSubscribed: boolean) => {
    if (isSubscribed) {
      return "inline-flex items-center px-4 py-2 border border-green-600 text-sm font-medium rounded-md text-green-600 bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-default";
    }
    return "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading influencers...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900 rounded-xl border border-gray-700 pb-4">
      <div className="px-6 py-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Top Crypto Influencers</h2>
        {subscriptionMessage && (
          <div className={`mt-2 p-2 rounded text-sm ${subscriptionMessage.includes('Successfully')
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
            }`}>
            {subscriptionMessage}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Influencer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {influencers.map((influencer: InfluencerWithSubscription) => (
              <tr key={influencer.id} className="hover:bg-gray-800 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 mr-4">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={influencer.image}
                        alt={influencer.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${influencer.name}&background=374151&color=ffffff`;
                        }}
                      />
                    </div>
                    <div className="text-sm font-medium text-white">
                      @{influencer.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => !influencer.isSubscribed && handleSubscribe(influencer.id, influencer.name)}
                    disabled={subscribingTo === influencer.id || !session || influencer.isSubscribed}
                    className={getButtonStyle(influencer.isSubscribed || false)}
                  >
                    {subscribingTo === influencer.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Subscribing...
                      </>
                    ) : influencer.isSubscribed ? (
                      <>
                        <CheckCircleSolid className="h-4 w-4 mr-2" />
                        Subscribed
                      </>
                    ) : !session ? (
                      'Login to Subscribe'
                    ) : (
                      'Subscribe'
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {influencers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400">No influencers found</div>
        </div>
      )}
    </div>
  );
};