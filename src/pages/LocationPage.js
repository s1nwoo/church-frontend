import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';    // ← 추가
import './LocationPage.css';

import iconCar from '../components/icons/icon_come_car.svg';
import iconCall from '../components/icons/icon_come_call.svg';
import iconSubway from '../components/icons/icon_come_subway.svg';
import iconBus from '../components/icons/icon_come_bus.svg';

function LocationPage() {
  useEffect(() => {
    const scriptId = 'kakao-map-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src =
        'https://dapi.kakao.com/v2/maps/sdk.js?appkey=e23118df70d7160a03f4cce2ee82b9f6&autoload=false';
      script.onload = () => loadMap();
      document.head.appendChild(script);
    } else {
      loadMap();
    }

    function loadMap() {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          const container = document.getElementById('map');
          const options = {
            center: new window.kakao.maps.LatLng(37.5707, 126.8123),
            level: 4,
          };
          const map = new window.kakao.maps.Map(container, options);
          const marker = new window.kakao.maps.Marker({
            position: map.getCenter(),
            map: map,
          });
          const infoWindow = new window.kakao.maps.InfoWindow({
            content: '<div style="padding:5px;">방화침례교회</div>',
          });
          infoWindow.open(map, marker);
        });
      }
    }
  }, []);

  return (
    <div className="location-container page-container">
      {/* ─ 상단 제목 ─ */}
      <h1 className="page-title">교회안내</h1>

      {/* ─ 소메뉴 (3개) ─ */}
      <nav className="location-submenu">
        <ul>
          <li>
            <NavLink
              to="/church-intro"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              교회소개
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/worship-info"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              예배안내
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/location"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              오시는 길
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* ─ 현재 페이지 제목 ─ */}

      <div id="map" className="location-map" />

      {/* 주소 */}
      <div className="info-row">
        <div className="icon-wrapper">
          <img src={iconCar} alt="주소" />
        </div>
        <div className="inline-text">
          <span className="content">
            07607 서울특별시 강서구 방화동로 115, 2층 (방화동 580-25)
          </span>
        </div>
      </div>

      {/* 교회안내 */}
      <div className="info-row">
        <div className="icon-wrapper">
          <img src={iconCall} alt="교회안내" />
        </div>
        <div className="inline-text">
          <span className="content">02-XXXX-XXXX</span>
        </div>
      </div>

      {/* 지하철 */}
      <div className="info-row">
        <div className="icon-wrapper">
          <img src={iconSubway} alt="지하철" />
        </div>
        <div className="inline-text">
          <span className="content">
            <div>
              <span className="subway-tag line5">5호선</span> 개화산역 1번출구 – 도보 11분
            </div>
            <div style={{ marginTop: '4px' }}>
              <span className="subway-tag line9">9호선</span> 신방화역 1번출구 – 도보 7분
            </div>
          </span>
        </div>
      </div>

      {/* 버스 */}
      <div className="info-row no-border">
        <div className="icon-wrapper">
          <img src={iconBus} alt="버스" />
        </div>
        <div className="inline-text">
          <span className="content">
            <div className="bus-stop">
              <strong>방신시장전통입구</strong>
              <p>
                <span className="bus-type">
                  <span className="bus-dot blue" /> 간선
                </span>
                <span className="bus-number">605</span>
              </p>
              <p>
                <span className="bus-type">
                  <span className="bus-dot green" /> 지선
                </span>
                <span className="bus-number">6647</span>
                <span className="bus-number">6629</span>
              </p>
            </div>

            <div className="bus-stop">
              <strong>방신전통시장정문 · 방화사거리</strong>
              <p>
                <span className="bus-type">
                  <span className="bus-dot blue" /> 간선
                </span>
                <span className="bus-number">605</span>
                <span className="bus-number">654</span>
              </p>
              <p>
                <span className="bus-type">
                  <span className="bus-dot green" /> 지선
                </span>
                <span className="bus-number">6629</span>
                <span className="bus-number">6631</span>
                <span className="bus-number">6647</span>
              </p>
            </div>

            <div className="bus-stop">
              <strong>마곡우촌아파트</strong>
              <p>
                <span className="bus-type">
                  <span className="bus-dot blue" /> 간선
                </span>
                <span className="bus-number">605</span>
              </p>
              <p>
                <span className="bus-type">
                  <span className="bus-dot green" /> 지선
                </span>
                <span className="bus-number">6631</span>
              </p>
            </div>
          </span>
        </div>
      </div>
    </div>
  );
}

export default LocationPage;
