import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/api.js";

// Çevre değişkenleri yükle
dotenv.config();

// Express uygulaması oluştur
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Ana sayfa
app.get("/", (req, res) => {
  res.send("MeLoc API - Sürüm 2.0");
});

// API rotaları
app.use('/api', apiRoutes);

// Bilinmeyen rotalar için 404
app.use((req, res) => {
  res.status(404).json({ error: "Rota bulunamadı" });
});

// Hata yönetimi middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Sunucu hatası",
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
});

// Sunucuyu başlat
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} numaralı portta çalışıyor`);
});
