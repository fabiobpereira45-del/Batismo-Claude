"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SALVADOR_PREFEITURAS, findBairro } from "@/lib/salvador-bairros";

interface IgrejaMapData {
  id: string;
  nome: string;
  pastor: string;
  logo_url?: string;
  bairro?: string;
  membersCount: number;
}

interface SalvadorMapProps {
  igrejas: IgrejaMapData[];
  selectedPbId: number | null;
  onSelectPB: (pbId: number | null) => void;
}

export default function SalvadorMap({ igrejas, selectedPbId, onSelectPB }: SalvadorMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);

  // Inicializa o mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Centraliza em Salvador BA
    const map = L.map(mapContainerRef.current, {
      center: [-12.935, -38.450],
      zoom: 12,
      minZoom: 10,
      zoomControl: true,
      maxBounds: [
        [-13.150, -38.700], // Sudoeste
        [-12.650, -38.200]  // Nordeste
      ]
    });

    // Layer de mapa escuro premium (CartoDB Dark Matter)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20
    }).addTo(map);

    mapRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    circlesLayerRef.current = L.layerGroup().addTo(map);

    // Limpeza ao desmontar
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Atualiza marcadores e circulos quando as igrejas ou selecao mudam
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    const circlesLayer = circlesLayerRef.current;

    if (!map || !markersLayer || !circlesLayer) return;

    // Limpa camadas anteriores
    markersLayer.clearLayers();
    circlesLayer.clearLayers();

    // 1. Desenhar Círculos das Prefeituras-Bairro
    SALVADOR_PREFEITURAS.forEach((pb) => {
      // Filtrar igrejas nessa prefeitura bairro
      const igrejasNaPB = igrejas.filter((i) => {
        if (!i.bairro) return false;
        const bInfo = findBairro(i.bairro);
        return bInfo && bInfo.pbId === pb.id;
      });

      const isSelected = selectedPbId === pb.id;
      const opacity = selectedPbId === null ? 0.2 : isSelected ? 0.35 : 0.05;
      const borderWeight = isSelected ? 3 : 1;

      // Desenha o círculo no mapa
      const circle = L.circle([pb.lat, pb.lng], {
        color: pb.cor,
        fillColor: pb.cor,
        fillOpacity: opacity,
        weight: borderWeight,
        radius: 1200 + (igrejasNaPB.length * 150) // tamanho varia com numero de igrejas
      });

      circle.bindTooltip(`
        <div class="p-1 font-sans notranslate" translate="no">
          <p class="font-black text-xs uppercase tracking-tight text-indigo-400 leading-none mb-1">${pb.nome}</p>
          <p class="text-[10px] text-slate-300 leading-none">${igrejasNaPB.length} Igreja(s) registrada(s)</p>
        </div>
      `, {
        permanent: false,
        direction: "top",
        className: "!bg-slate-950 !border-white/10 !rounded-xl !p-2 !shadow-xl !text-white"
      });

      // Evento de clique para filtrar/zoom
      circle.on("click", () => {
        if (isSelected) {
          onSelectPB(null); // Desmarca se clicar de novo
        } else {
          onSelectPB(pb.id);
          map.setView([pb.lat, pb.lng], 14, { animate: true });
        }
      });

      circle.addTo(circlesLayer);
    });

    // 2. Desenhar Pins das Igrejas
    igrejas.forEach((igreja) => {
      if (!igreja.bairro) return;

      const bairroInfo = findBairro(igreja.bairro);
      if (!bairroInfo) return; // Não geolocalizado

      const pbInfo = SALVADOR_PREFEITURAS.find(p => p.id === bairroInfo.pbId);
      const accentColor = pbInfo ? pbInfo.cor : "#6366f1";

      // Adiciona um pequeno jitter/offset para evitar pins perfeitamente sobrepostos no mesmo bairro
      const jitterLat = (Math.random() - 0.5) * 0.003;
      const jitterLng = (Math.random() - 0.5) * 0.003;
      const lat = bairroInfo.lat + jitterLat;
      const lng = bairroInfo.lng + jitterLng;

      // DivIcon com a logo ou iniciais da igreja
      const markerIcon = L.divIcon({
        html: `
          <div class="relative w-8 h-8 rounded-full border-2 bg-slate-950 shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95" 
               style="border-color: ${accentColor};">
            ${
              igreja.logo_url 
                ? `<img src="${igreja.logo_url}" class="w-full h-full object-cover rounded-full" />` 
                : `<div class="font-black text-[9px] text-white uppercase tracking-tight">${igreja.nome.substring(0, 2)}</div>`
            }
            <span class="absolute -bottom-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 border border-white/10 text-[8px] font-black text-slate-300">
              ${igreja.membersCount}
            </span>
          </div>
        `,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([lat, lng], { icon: markerIcon });

      // Popup detalhado com design premium
      marker.bindPopup(`
        <div class="p-3 max-w-[220px] font-sans text-left notranslate" translate="no">
          <div class="flex items-center gap-2 mb-2">
            ${
              igreja.logo_url 
                ? `<img src="${igreja.logo_url}" class="w-6 h-6 object-cover rounded bg-white" />` 
                : `<div class="w-6 h-6 rounded bg-slate-800 border border-white/5 flex items-center justify-center font-bold text-[8px] text-indigo-400">${igreja.nome.substring(0, 2)}</div>`
            }
            <h4 class="font-black text-xs text-white uppercase tracking-tight leading-tight truncate m-0">${igreja.nome}</h4>
          </div>
          <div class="space-y-1 text-[10px] text-slate-300 border-t border-white/5 pt-2">
            <p class="m-0"><strong class="text-slate-400 uppercase">Pastor:</strong> ${igreja.pastor || "Não informado"}</p>
            <p class="m-0"><strong class="text-slate-400 uppercase">Bairro:</strong> ${bairroInfo.nome} (${pbInfo ? pbInfo.nome : "Sem Região"})</p>
            <p class="m-0"><strong class="text-slate-400 uppercase">Membros:</strong> ${igreja.membersCount} ativo(s)</p>
          </div>
        </div>
      `, {
        className: "custom-leaflet-popup"
      });

      marker.addTo(markersLayer);
    });

  }, [igrejas, selectedPbId]);

  // Se houver alteração de PB de fora (ex: sidebar), ajusta a visualização do mapa
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedPbId === null) {
      // Zoom global em Salvador
      map.setView([-12.935, -38.450], 12, { animate: true });
    } else {
      const pb = SALVADOR_PREFEITURAS.find(p => p.id === selectedPbId);
      if (pb) {
        map.setView([pb.lat, pb.lng], 14, { animate: true });
      }
    }
  }, [selectedPbId]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* CSS customizado para Leaflet popups em sintonia com a estética do app */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.9) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 1rem !important;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .leaflet-container {
          background: #09090b !important;
        }
        .leaflet-bar {
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 0.75rem !important;
          overflow: hidden;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3) !important;
        }
        .leaflet-bar a {
          background-color: rgba(15, 23, 42, 0.95) !important;
          color: #f1f5f9 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        .leaflet-bar a:hover {
          background-color: rgba(99, 102, 241, 0.2) !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
}
