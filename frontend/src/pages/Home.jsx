import React, { useState, useEffect } from "react";
import api from "../api"; // api.js'teki instance'ı kullan
import { Link } from "react-router-dom"; // Sayfalar arası geçiş için
import {
  MapPin,
  Search,
  Clock,
  Leaf,
  Package,
  User,
  Calendar,
  MessageCircle,
  Send,
  Loader2,
  Pencil, // Düzenleme ikonu için eklendi
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

// --- Bileşenler (Bu sayfada kullanmak için) ---
// Normalde bu bileşenler 'components/ui.jsx' gibi paylaşılan bir dosyada
// olmalı, ancak isteğiniz üzerine HomePage içinde tanımlanıyorlar.

const Avatar = ({ src, fallback }) => (
  <div className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-blue-500/20">
    <img className="aspect-square h-full w-full" src={src} alt="Kullanıcı avatarı" onError={(e) => {
        e.currentTarget.src = `https://placehold.co/100x100/EBF8FF/3B82F6?text=${fallback}`;
      }} />
  </div>
);

const Badge = ({ children, variant = "secondary" }) => {
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  const variants = {
    secondary: "border-transparent bg-gray-200 text-gray-800",
    offer: "border-transparent bg-blue-600 text-white shadow-sm",
    need: "border-transparent bg-orange-500 text-white shadow-sm",
  };
  return (
    <div className={`${baseClasses} ${variants[variant] || variants.secondary}`}>
      {children}
    </div>
  );
};

const Card = ({ children, className = "", ...props }) => (
  <div
    className={`rounded-lg border bg-white text-gray-900 shadow-sm transition-all ${className}`}
    {...props}
  >
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`flex flex-col space-y-1.5 p-4 pb-3 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-base font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-4 pt-0 ${className}`}>{children}</div>
);

const Button = ({ children, variant = "default", size = "default", className = "", ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-600/90 shadow-md",
    ghost: "hover:bg-gray-100 hover:text-gray-900",
    outline: "border border-blue-500/30 bg-transparent hover:bg-blue-500/5",
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
  };
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = "", ...props }) => (
  <input
    className={`flex h-10 w-full rounded-md border border-blue-500/20 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Select = ({ children, onValueChange, placeholder }) => (
  <select
    onChange={(e) => onValueChange(e.target.value)}
    className="flex h-10 w-[180px] items-center justify-between rounded-md border border-blue-500/20 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <option value="">{placeholder || "Seçiniz"}</option>
    {children}
  </select>
);

const SelectItem = ({ children, value }) => (
  <option value={value}>{children}</option>
);

const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (
    <div
      onClick={() => onOpenChange(false)}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-50 grid w-full max-w-2xl max-h-[90vh] gap-4 overflow-y-auto rounded-lg border bg-white p-6 shadow-lg"
      >
        {children}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <span className="text-2xl">&times;</span>
        </button>
      </div>
    </div>
  );
};

const DialogHeader = ({ children }) => <div className="flex flex-col space-y-1.5 text-center sm:text-left">{children}</div>;
const DialogTitle = ({ children }) => <h2 className="text-2xl font-semibold leading-none tracking-tight mb-2">{children}</h2>;
const DialogDescription = ({ children }) => <div className="text-sm text-gray-500 flex items-center gap-2">{children}</div>;

const Separator = () => <hr className="my-4 border-blue-500/20" />;

const Tabs = ({ defaultValue, onValueChange, children }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  const handleTabChange = (value) => {
    setActiveTab(value);
    if (onValueChange) onValueChange(value);
  };
  
  // Çocukları klonlarken null/undefined kontrolü ekle
  const clonedChildren = React.Children.map(children, (child) => {
    if (!child) return null; // Null çocukları atla
    
    if (child.type === TabsList) {
      return React.cloneElement(child, { activeTab, onTabChange: handleTabChange });
    }
    if (child.type === TabsContent) {
      return React.cloneElement(child, { activeTab });
    }
    return child;
  });
  return <div>{clonedChildren}</div>;
};

const TabsList = ({ children, className = "", activeTab, onTabChange }) => (
  <div className={`w-full flex rounded-md bg-gray-200/50 border border-blue-500/20 p-1 ${className}`}>
    {React.Children.map(children, (child) => {
      if (!child) return null; // Null çocukları atla
      return React.cloneElement(child, {
        isActive: activeTab === child.props.value,
        onClick: () => onTabChange(child.props.value),
      });
    })}
  </div>
);

const TabsTrigger = ({ children, className = "", value, isActive, onClick }) => {
  const activeClasses = "bg-blue-600 text-white";
  const inactiveClasses = "hover:bg-gray-100";
  return (
    <button
      onClick={onClick}
      className={`flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive ? activeClasses : inactiveClasses} ${className}`}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ children, value, activeTab, className = "" }) => {
  if (value !== activeTab) return null;
  return <div className={`mt-4 ${className}`}>{children}</div>;
};

// --- Ana HomePage Bileşeni ---

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("offers");

  // Arama ve filtre state'leri
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedType, setSelectedType] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        // Filtre parametrelerini hazırla
        const params = new URLSearchParams();
        if (selectedType) params.append('post_type', selectedType);
        if (selectedTag) params.append('tags__name', selectedTag); // Backend'de 'tags__name' filtresi olmalı
        if (selectedLocation) params.append('location', selectedLocation);
        if (searchTerm) params.append('search', searchTerm); // Backend'de 'search' filtresi olmalı

        const response = await api.get('/posts/', { params });
        
        const formattedPosts = response.data.map(post => ({
          id: post.id,
          title: post.title,
          tags: post.tags, // Bu, backend'den gelen string dizisi ["Gardening", "Music"]
          location: post.location,
          type: post.post_type, 
          description: post.description,
          duration: post.duration,
          postedBy: post.postedBy,
          avatar: post.avatar,
          postedDate: formatDistanceToNow(new Date(post.postedDate), {
            addSuffix: true,
            locale: tr,
          }),
          mapPosition: { 
            // Harita pinleri için rastgele pozisyon
            top: `${Math.random() * 60 + 20}%`, 
            left: `${Math.random() * 60 + 20}%` 
          }, 
        }));
        
        setPosts(formattedPosts);
      } catch (err) {
        console.error("Veri çekme hatası:", err);
        setError("İlanlar yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    const fetchTags = async () => {
      try {
        const response = await api.get('/tags/');
        setTags(response.data); // Bu, {id: 1, name: "Gardening"} listesi
      } catch (err) {
        console.error("Etiketleri çekerken hata:", err);
      }
    };

    fetchPosts(); // Filtreler değiştikçe de çağrılmalı, şimdilik sadece ilk yüklemede
    fetchTags();
  }, []); // Not: Filtreler değiştiğinde veriyi yeniden çekmek için bu dependency array'i güncellemek gerekir.


  // Filtrelenmiş veriyi almak için useEffect'i güncelle (Sadece frontend'de filtreleme)
  // Backend'den filtreleme yapmak daha verimlidir, ancak bu yöntem
  // frontend'de anlık filtreleme sağlar.
  const filteredPosts = posts.filter(post => {
    const typeMatch = selectedType ? post.type === selectedType : true;
    const tagMatch = selectedTag ? post.tags.includes(selectedTag) : true;
    const locationMatch = selectedLocation ? post.location.toLowerCase().includes(selectedLocation.toLowerCase()) : true;
    const searchMatch = searchTerm ? 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    
    return typeMatch && tagMatch && locationMatch && searchMatch;
  });


  const offerPosts = filteredPosts.filter((post) => post.type === "offer");
  const needPosts = filteredPosts.filter((post) => post.type === "need");
  const mapPosts = activeTab === 'offers' ? offerPosts : needPosts;

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsDialogOpen(true);
  };

  if (loading && posts.length === 0) { // Sadece ilk yüklemede tam ekran loading göster
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="ml-4 text-lg text-gray-700">Yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <p className="text-lg text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen pb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500/5 to-orange-500/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-blue-600 font-bold text-lg">The Hive</h3>
            <p className="text-xs text-gray-500">
              Topluluk Zaman Bankası
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Bakiye: 0 Saat</span>
          </div>
          <Button variant="ghost">Profilim</Button>
        </div>
      </div>

      {/* Search Area */}
      <div className="px-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Metin, etiket veya konuma göre ara..."
            className="pl-10 bg-white border-blue-500/20 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Select
            placeholder="Etikete göre filtrele"
            onValueChange={setSelectedTag}
          >
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.name}>
                {tag.name}
              </SelectItem>
            ))}
          </Select>

          <Select
            placeholder="Konum"
            onValueChange={setSelectedLocation}
          >
            {/* Konumları dinamik olarak postlardan alabiliriz (daha iyi bir yaklaşım) */}
            {[...new Set(posts.map(p => p.location))].map(location => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </Select>

          <Select
            placeholder="Tip"
            onValueChange={setSelectedType}
          >
            <SelectItem value="offer">Teklifler</SelectItem>
            <SelectItem value="need">İhtiyaçlar</SelectItem>
          </Select>
        </div>
      </div>

      {/* Map Area */}
      <div className="px-4">
        <Card className="overflow-hidden shadow-md border-blue-500/20">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-orange-500/10 via-gray-50 to-blue-500/10 h-[300px] flex items-center justify-center relative overflow-hidden">
              <div className="text-gray-500 text-center z-10">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p>Harita Entegrasyonu (Gelecek)</p>
                <p className="text-sm">
                  İlanlar haritada gösterilecek
                </p>
              </div>

              {mapPosts.map((post) => {
                  const pinColor =
                    post.type === "offer" ? "#3B82F6" : "#F97316";
                  return (
                    <div
                      key={post.id}
                      className="absolute w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: pinColor,
                        ...post.mapPosition,
                      }}
                      onClick={() => handlePostClick(post)}
                    >
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Post List with Tabs */}
      <div className="px-4">
        <Tabs
          defaultValue="offers"
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger
              value="offers"
            >
              <Leaf className="w-4 h-4 mr-2" />
              Teklifler ({offerPosts.length})
            </TabsTrigger>
            <TabsTrigger
              value="needs"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <Package className="w-4 h-4 mr-2" />
              İhtiyaçlar ({needPosts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="offers" className="space-y-3 mt-4">
            {loading && <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />}
            {!loading && offerPosts.length === 0 && (
              <p className="text-gray-500 text-center py-4">Filtreye uygun teklif bulunamadı.</p>
            )}
            {offerPosts.map((post) => (
                <Card
                  key={post.id}
                  className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer border-blue-500/20"
                  onClick={() => handlePostClick(post)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>
                          {post.title}
                        </CardTitle>
                        <div className="flex items-center flex-wrap gap-2 mt-2">
                          {post.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge
                        variant="offer"
                      >
                        Teklif
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>{post.location}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="needs" className="space-y-3 mt-4">
             {loading && <Loader2 className="w-6 h-6 text-orange-500 animate-spin mx-auto" />}
             {!loading && needPosts.length === 0 && (
              <p className="text-gray-500 text-center py-4">Filtreye uygun ihtiyaç bulunamadı.</p>
            )}
            {needPosts.map((post) => (
                <Card
                  key={post.id}
                  className="hover:border-orange-500 hover:shadow-md transition-all cursor-pointer border-blue-500/20"
                  onClick={() => handlePostClick(post)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>
                          {post.title}
                        </CardTitle>
                        <div className="flex items-center flex-wrap gap-2 mt-2">
                          {post.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge
                        variant="need"
                      >
                        İhtiyaç
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>{post.location}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create New Post Button -> Artık Link olarak çalışıyor */}
      <div className="px-4 pb-4 mt-4">
        <Link to="/post/new" className="w-full">
          <Button className="w-full shadow-md" size="lg">
            <Leaf className="w-4 h-4 mr-2" />
            Yeni İlan Oluştur
          </Button>
        </Link>
      </div>

      {/* Post Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedPost && (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle>
                    {selectedPost.title}
                  </DialogTitle>
                  <DialogDescription>
                    <MapPin className="w-4 h-4 text-blue-600" />
                    {selectedPost.location}
                  </DialogDescription>
                </div>
                <Badge
                  variant={
                    selectedPost.type === "offer" ? "offer" : "need"
                  }
                >
                  {selectedPost.type === "offer" ? "Teklif" : "İhtiyaç"}
                </Badge>
              </div>
            </DialogHeader>

            <Separator />

            {/* User Info */}
            <div className="flex items-center gap-3 bg-gray-100 p-4 rounded-lg border border-blue-500/10">
              <Avatar
                src={selectedPost.avatar}
                fallback={selectedPost.postedBy.split(" ").map((n) => n[0]).join("")}
              />
              <div className="flex-1">
                <p className="font-medium">{selectedPost.postedBy}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{selectedPost.postedDate} yayınlandı</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600">
                <User className="w-4 h-4 mr-2" />
                Profili Görüntüle
              </Button>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Kategoriler</p>
              <div className="flex flex-wrap gap-2">
                {selectedPost.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <MessageCircle className="w-5 h-5" />
                <h4>Açıklama</h4>
              </div>
              <p className="text-gray-600 leading-relaxed pl-7">
                {selectedPost.description}
              </p>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500/5 to-orange-500/10 p-4 rounded-lg border border-blue-500/20">
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Tahmini Süre
                </p>
                <p className="font-medium text-blue-600">
                  {selectedPost.duration}
                </p>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                className="flex-1 shadow-md"
                size="lg"
                onClick={() => {
                  console.log(
                    "İstek gönderildi:",
                    selectedPost.title,
                  );
                  setIsDialogOpen(false);
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                {selectedPost.type === "offer"
                  ? "Hizmet Talep Et"
                  : "Yardım Teklif Et"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 border-gray-300"
                onClick={() => {
                  console.log(
                    "Mesaj gönder:",
                    selectedPost.postedBy,
                  );
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Mesaj Gönder
              </Button>
              {/* Düzenle Butonu (Link olarak) */}
              <Link to={`/post/edit/${selectedPost.id}`} className="flex-1">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-yellow-500/30 hover:bg-yellow-500/5 text-yellow-600"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Düzenle
                </Button>
              </Link>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}