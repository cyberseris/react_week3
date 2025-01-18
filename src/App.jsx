import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Modal } from 'bootstrap';

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;
const defaultModalState = {
  imageUrl: "",
  title: "",
  category: "",
  unit: "",
  origin_price: "",
  price: "",
  description: "",
  content: "",
  is_enabled: 0,
  imagesUrl: [""]
};

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [products, setProducts] = useState([]);
  /* const [tempProduct, setTempProduct] = useState({}); */

  const [account, setAccount] = useState({
    username: "example@test.com",
    password: "example"
  });

  const handleInputChange = (e) => {
    const { value, name } = e.target
    setAccount({
      ...account,
      [name]: value
    })
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const resLogin = await axios.post(`${BASE_URL}/v2/admin/signin`, account)
      const { token, expired } = resLogin.data

      document.cookie = `hexToken=${token}; expires=${new Date(expired)}`;
      axios.defaults.headers.common['Authorization'] = token;
      getProducts();
      setIsAuth(true)

    } catch (error) {
      alert("登入失敗");
    }
  };

  const getProducts = async () => {
    const resProduct = await axios.get(`${BASE_URL}/v2/api/${API_PATH}/products/all`);

    setProducts(resProduct.data.products)
  };

  const checkUserLogin = async () => {
    try {
      await axios.post(`${BASE_URL}/v2/api/user/check`);
      getProducts();
      setIsAuth(true);
    } catch (error) {
      alert("使用者未登入");
    }

  };

  const [modalMode, setModalMode] = useState(null);

  const handleOpenProductModal = (mode, product) => {
    setModalMode(mode);
    setTempProduct(product);
    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.show();
  };

  const handleCloseProductModal = () => {
    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.hide();
  };

  const productModalRef = useRef(null);
  useEffect(() => {
    new Modal(productModalRef.current, {
      backdrop: false
    });
  }, [])

  useEffect(() => {
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)hexToken\s*\=\s*([^;]*).*$)|^.*$/,
      "$1",
    );
    axios.defaults.headers.common['Authorization'] = token;
    checkUserLogin();
  }, []);

  const [tempProduct, setTempProduct] = useState(defaultModalState);
  const [tempImage, setTempImage] = useState("");
  const handleImageChange = (e, index) => {
    const { value } = e.target;
    const newImages = [...tempProduct.imagesUrl];
    newImages[index] = value;

    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages.filter(image => image != "")
    })
  }

  const handleTempImageChange = (e) => {
    setTempImage(e.target.value)
  }

  const handleModalInputChange = (e) => {
    const { value, name, checked, type } = e.target;
    setTempProduct({
      ...tempProduct,
      [name]: type === "checkbox" ? checked : value
    })
  }

  const handleAddImage = () => {
    const newImages = [...tempProduct.imagesUrl];
    newImages[newImages.filter(image => image != "").length] = tempImage;

    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages
    })
    setTempImage("")
  }

  const handleDeleteImage = () => {
    let newImages = [...tempProduct.imagesUrl];
    newImages = newImages.filter(image => image != "").slice(0, -1)

    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages
    })
  }

  const createProduct = async (product) => {
    const createProduct = {
      ...product,
      origin_price: Number(product.origin_price),
      price: Number(product.price)
    }
    const resCreate = await axios.post(`${BASE_URL}/v2/api/${API_PATH}/admin/product`, {
      data: createProduct
    })
    getProducts();
    handleCloseProductModal();
  }

  const updateProduct = async (product) => {
    const updateProduct = {
      ...product,
      origin_price: Number(product.origin_price),
      price: Number(product.price)
    }
    const resUpdate = await axios.put(`${BASE_URL}/v2/api/${API_PATH}/admin/product/${product.id}`, {
      data: updateProduct
    })
    getProducts();
    handleCloseProductModal();
  }

  const deleteProduct = async (id) => {
    const delRes = await axios.delete(`${BASE_URL}/v2/api/${API_PATH}/admin/product/${id}`);
    getProducts();
  }

  return (
    <>
      {isAuth ? (<div className="container">
        <div className="text-end mt-4 d-flex justify-content-between">
          <h2>產品列表</h2>
          <button className="btn btn-primary" onClick={() => handleOpenProductModal('create', defaultModalState)}>建立新的產品</button>
        </div>
        <table className="table mt-4">
          <thead>
            <tr>
              <th scope="col">產品名稱</th>
              <th scope="col">原價</th>
              <th scope="col">售價</th>
              <th scope="col">是否啟用</th>
              <th scope="col">編輯</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              return (
                <tr key={product.id}>
                  <td>{product.title}</td>
                  <td>{product.origin_price}</td>
                  <td>{product.price}</td>
                  <td>{product.is_enabled ? '啟用' : '未啟用'}</td>
                  <td><button type="button" onClick={() => handleOpenProductModal('edit', product)} className="btn btn-outline-primary me-2">編輯</button><button type="button" onClick={() => deleteProduct(product.id)} className="btn btn-outline-danger">刪除</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      ) : (<div className="d-flex flex-column justify-content-center align-items-center vh-100">
        <h1 className="mb-5">請先登入</h1>
        <form className="d-flex flex-column gap-3">
          <div className="form-floating mb-3">
            <input type="email" onChange={handleInputChange} name="username" className="form-control" id="username" value={account.username} placeholder="name@example.com" />
            <label htmlFor="username">Email address</label>
          </div>
          <div className="form-floating">
            <input type="password" onChange={handleInputChange} value={account.password} name="password" className="form-control" id="password" placeholder="Password" />
            <label htmlFor="password">Password</label>
          </div>
          <button type="button" onClick={handleLogin} className="btn btn-primary">登入</button>
        </form>
        <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
      </div>)

      }

      <div id="productModal" ref={productModalRef} className="modal" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content border-0 shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title fs-4">{modalMode === "create" ? '新增產品' : '編輯產品'}</h5>
              <button type="button" onClick={handleCloseProductModal} className="btn-close" aria-label="Close"></button>
            </div>

            <div className="modal-body p-4">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="mb-4">
                    <label htmlFor="primary-image" className="form-label">
                      主圖
                    </label>
                    <div className="input-group">
                      <input
                        value={tempProduct.imageUrl}
                        onChange={handleModalInputChange}
                        name="imageUrl"
                        type="text"
                        id="primary-image"
                        className="form-control"
                        placeholder="請輸入圖片連結"
                      />
                    </div>
                    <img
                      src={tempProduct.imageUrl}
                      alt={tempProduct.title}
                      className="img-fluid"
                    />
                  </div>

                  {/* 副圖 */}
                  <div className="border border-2 border-dashed rounded-3 p-3">
                    {tempProduct?.imagesUrl?.map((image, index) => (
                      image && (
                        <div key={index} className="mb-2" >
                          <label
                            htmlFor={`imagesUrl-${index + 1}`}
                            className="form-label"
                          >
                            副圖 {index + 1}
                          </label>
                          <input
                            value={image}
                            onChange={(e) => handleImageChange(e, index)}
                            id={`imagesUrl-${index + 1}`}
                            type="text"
                            placeholder={`圖片網址 ${index + 1}`}
                            className="form-control mb-2"
                          />
                          {image && (
                            <img
                              src={image}
                              alt={`副圖 ${index + 1}`}
                              className="img-fluid mb-2"
                            />
                          )}
                        </div>)
                    ))
                    }

                    {
                      tempProduct?.imagesUrl.filter(image => image != "").length < 5 && (
                        <div className='d-flex flex-column'>
                          <label
                            htmlFor={`imagesUrl-${tempProduct?.imagesUrl.filter(image => image != "").length + 1}`}
                            className="form-label"
                          >
                            副圖 {tempProduct?.imagesUrl.filter(image => image != "").length + 1}
                          </label>
                          <input
                            value={tempImage}
                            onChange={(e) => handleTempImageChange(e)}
                            id={`imagesUrl-${tempProduct?.imagesUrl.filter(image => image != "").length + 1}`}
                            type="text"
                            placeholder={`圖片網址 ${tempProduct?.imagesUrl.filter(image => image != "").length + 1}`}
                            className="form-control mb-2"
                          />
                          <img
                            src={tempImage}
                            alt={`副圖 ${tempProduct?.imagesUrl.filter(image => image != "").length + 1}`}
                            className="img-fluid mb-2"
                          />
                        </div>
                      )
                    }
                    <div className='d-flex'>
                      {
                        tempProduct?.imagesUrl.filter(image => image != "").length < 5 && (
                          <button type="button" onClick={handleAddImage} className="btn btn-outline-primary btn-sm d-block w-100 me-2">
                            新增圖片
                          </button>
                        )
                      }
                      {
                        tempProduct?.imagesUrl[1] && tempProduct?.imagesUrl.filter(image => image != "").length > 1 && (<button type="button" onClick={handleDeleteImage} className="btn btn-outline-danger btn-sm d-block w-100">
                          刪除圖片
                        </button>)
                      }
                    </div>
                  </div>
                </div>

                <div className="col-md-8">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      標題
                    </label>
                    <input
                      value={tempProduct.title}
                      onChange={handleModalInputChange}
                      name="title"
                      id="title"
                      type="text"
                      className="form-control"
                      placeholder="請輸入標題"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="category" className="form-label">
                      分類
                    </label>
                    <input
                      value={tempProduct.category}
                      onChange={handleModalInputChange}
                      name="category"
                      id="category"
                      type="text"
                      className="form-control"
                      placeholder="請輸入分類"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="unit" className="form-label">
                      單位
                    </label>
                    <input
                      value={tempProduct.unit}
                      onChange={handleModalInputChange}
                      name="unit"
                      id="unit"
                      type="text"
                      className="form-control"
                      placeholder="請輸入單位"
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label htmlFor="origin_price" className="form-label">
                        原價
                      </label>
                      <input
                        value={tempProduct.origin_price}
                        onChange={handleModalInputChange}
                        name="origin_price"
                        id="origin_price"
                        type="number"
                        className="form-control"
                        placeholder="請輸入原價"
                      />
                    </div>
                    <div className="col-6">
                      <label htmlFor="price" className="form-label">
                        售價
                      </label>
                      <input
                        value={tempProduct.price}
                        onChange={handleModalInputChange}
                        name="price"
                        id="price"
                        type="number"
                        className="form-control"
                        placeholder="請輸入售價"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      產品描述
                    </label>
                    <textarea
                      value={tempProduct.description}
                      onChange={handleModalInputChange}
                      name="description"
                      id="description"
                      className="form-control"
                      rows={4}
                      placeholder="請輸入產品描述"
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">
                      說明內容
                    </label>
                    <textarea
                      value={tempProduct.content}
                      onChange={handleModalInputChange}
                      name="content"
                      id="content"
                      className="form-control"
                      rows={4}
                      placeholder="請輸入說明內容"
                    ></textarea>
                  </div>

                  <div className="form-check">
                    <input
                      checked={tempProduct.is_enabled}
                      onChange={handleModalInputChange}
                      name="is_enabled"
                      type="checkbox"
                      className="form-check-input"
                      id="isEnabled"
                    />
                    <label className="form-check-label" htmlFor="isEnabled">
                      是否啟用
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-top bg-light">
              <button type="button" onClick={handleCloseProductModal} className="btn btn-secondary">
                取消
              </button>
              <button type="button" onClick={() => modalMode === "create" ? createProduct(tempProduct) : updateProduct(tempProduct)} className="btn btn-primary">
                確認
              </button>
            </div>
          </div>
        </div>
      </div >
    </>
  )
}



export default App
