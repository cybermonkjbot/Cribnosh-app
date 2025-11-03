import { useLocation } from '../../context/location-context';
import { AnalyticsProvider } from './AnalyticsProvider';

export function AnalyticsComponent(props) {
  const { location, loading } = useLocation();

  // Now you can use location in analytics logic

  return (
    <div>
      {/* Render analytics information here */}
      {loading ? <span>Loading...</span> : <span>Location: {location}</span>}
    </div>
  );
}

export { AnalyticsProvider };