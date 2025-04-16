import React, { useEffect } from 'react';

function LocationPage() {
  useEffect(() => {
    const scriptId = "kakao-map-script";
    const existingScript = document.getElementById(scriptId);

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=e23118df70d7160a03f4cce2ee82b9f6&autoload=false';
      script.onload = () => loadMap(); // 로드 완료 후 실행
      document.head.appendChild(script);
    } else {
      loadMap(); // 이미 로드된 경우 바로 실행
    }

    function loadMap() {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          const container = document.getElementById('map');
          const options = {
            center: new window.kakao.maps.LatLng(37.5707, 126.8123),
            level: 3
          };

          const map = new window.kakao.maps.Map(container, options);

          const marker = new window.kakao.maps.Marker({
            position: map.getCenter(),
            map: map
          });

          const infoWindow = new window.kakao.maps.InfoWindow({
            content: '<div style="padding:5px;">방화침례교회</div>'
          });
          infoWindow.open(map, marker);
        });
      }
    }
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>📍 방화침례교회 오시는 길</h2>
      <div id="map" style={{ width: '100%', height: '500px', marginTop: '20px' }}></div>
    </div>
  );
}

export default LocationPage;
