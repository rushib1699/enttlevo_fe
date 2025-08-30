import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Loader2,
  DollarSign,
  Hash,
  Calculator
} from 'lucide-react';

import { useUserPermission } from '@/context/UserPermissionContext';
import { 
  getProducts, 
  getProductByCustomerCompanyId, 
  addCustomerProduct, 
  updateCustomerProduct, 
  getContactByCompanyCustomerId,
  removeProductContact
} from '@/api';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProductAndServiceProps {
  companyId: number;
  customerId: number;
  userId: number;
}

// Form schemas
const addProductSchema = z.object({
  product_id: z.string().min(1, 'Please select a product'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price must be at least 0'),
  contacts: z.array(z.string()).optional(),
});

const editProductSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price must be at least 0'),
  contacts: z.array(z.string()).optional(),
});

const ProductAndService: React.FC<ProductAndServiceProps> = ({ companyId, customerId, userId }) => {
  const { hasAccess } = useUserPermission();

  const hasWritePermission = hasAccess('write');
  const isSuperAdmin = hasAccess("superadmin");
  const canAddProduct = hasWritePermission || isSuperAdmin;

  const [products, setProducts] = useState<any[]>([]);
  const [customerProducts, setCustomerProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCustomerLoading, setIsCustomerLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [lastSelectedProduct, setLastSelectedProduct] = useState<any>(null);
  const [userChangedPrice, setUserChangedPrice] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);

  // Forms
  const addForm = useForm({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      product_id: '',
      quantity: 1,
      price: 0,
      contacts: [],
    },
  });

  const editForm = useForm({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      quantity: 1,
      price: 0,
      contacts: [],
    },
  });

  // Fetch all products for the company
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await getProducts({ 
        company_id: companyId, 
        user_id: userId 
      });
      setProducts(response.filter((product: any) => product.is_active === 1));
    } catch (error) {
      toast.error('Error fetching products');
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch products already added for this customer
  const fetchCustomerProducts = async () => {
    try {
      setIsCustomerLoading(true);
      const response = await getProductByCustomerCompanyId({
        company_id: companyId,
        company_customer_id: customerId
      });
      setCustomerProducts(response);
    } catch (error) {
      toast.error('Error fetching customer products');
    } finally {
      setIsCustomerLoading(false);
    }
  }

  const fetchContacts = async () => {
    try {
      const response = await getContactByCompanyCustomerId({
        company_customer_id: customerId,
        company_id: companyId
      });
      setContacts(response);
    } catch (error) {
      toast.error('Error fetching contacts');
    }
  }

  useEffect(() => {
    fetchProducts();
    fetchCustomerProducts();
    fetchContacts();
    // eslint-disable-next-line
  }, [companyId, customerId]);

  // Add product for this customer
  const handleAddCustomerProduct = async (values: any) => {
    try {
      setIsSubmitting(true);
      const selectedProduct = products.find(p => p.id === parseInt(values.product_id));
      if (!selectedProduct) {
        toast.error('Invalid product selected');
        return;
      }
      const payload = {
        product_id: parseInt(values.product_id),
        quantity: values.quantity,
        price: values.price,
        user_id: userId,
        company_customer_id: customerId,
        company_id: companyId,
        contacts: values.contacts || []
      };
      await addCustomerProduct(payload);
      toast.success('Product added for customer');
      setIsAddModalOpen(false);
      addForm.reset();
      fetchCustomerProducts();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error === "Duplicate record exists."
        ? "This product is already added for this customer"
        : error.response?.data?.message || 'Error adding product for customer';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === parseInt(productId));
    setLastSelectedProduct(product);
    setUserChangedPrice(false);
    const quantity = addForm.getValues('quantity') || 1;
    if (product) {
      addForm.setValue('price', product.price * quantity);
    } else {
      addForm.setValue('price', 0);
    }
  };

  const handleQuantityChange = (quantity: number) => {
    if (!userChangedPrice && lastSelectedProduct) {
      addForm.setValue('price', lastSelectedProduct.price * quantity);
    }
  };

  const handlePriceChange = () => {
    setUserChangedPrice(true);
  };

  // Edit customer product
  const openEditModal = async (product: any) => {
    await fetchContacts();
    setEditingProduct(product);
    setIsEditModalOpen(true);
    
    // Extract contact IDs from the contact array
    const contactIds = product.contact && Array.isArray(product.contact) 
      ? product.contact.map((contact: any) => contact.id.toString()) 
      : [];
    
    editForm.reset({
      quantity: product.quantity,
      price: product.price,
      contacts: contactIds
    });
  };

  const handleUpdateCustomerProduct = async (values: any) => {
    if (!editingProduct) return;
    try {
      setIsSubmitting(true);
      const payload = {
        id: editingProduct.id,
        product_id: editingProduct.product_id || editingProduct.productId || editingProduct.product?.id,
        quantity: values.quantity,
        price: values.price,
        user_id: userId,
        company_customer_id: customerId,
        company_id: companyId,
        is_active: 1,
        is_deleted: 0,
        contacts: values.contacts || []
      };
      await updateCustomerProduct(payload);
      toast.success('Customer product updated');
      setIsEditModalOpen(false);
      setEditingProduct(null);
      editForm.reset();
      fetchCustomerProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating customer product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove contact from product
  const handleRemoveContact = async (productId: number, contactId: number) => {
    try {
      setIsSubmitting(true);
      await removeProductContact({
        company_customer_id: customerId,
        customer_product_id: productId,
        id: contactId,
        user_id: userId
      });
      toast.success('Contact removed from product');
      fetchCustomerProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error removing contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete customer product
  const openDeleteModal = (product: any) => {
    setDeletingProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCustomerProduct = async () => {
    if (!deletingProduct) return;
    try {
      setIsSubmitting(true);
      const payload = {
        id: deletingProduct.id,
        product_id: deletingProduct.product_id || deletingProduct.productId || deletingProduct.product?.id,
        quantity: deletingProduct.quantity,
        price: deletingProduct.price,
        user_id: userId,
        company_customer_id: customerId,
        company_id: companyId,
        is_active: 0,
        is_deleted: 1,
        contacts: deletingProduct.contact && Array.isArray(deletingProduct.contact) 
          ? deletingProduct.contact.map((contact: any) => contact.id) 
          : []
      };
      await updateCustomerProduct(payload);
      toast.success('Product deleted successfully');
      setIsDeleteModalOpen(false);
      setDeletingProduct(null);
      fetchCustomerProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error deleting product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Product and Service</h2>
              <p className="text-sm text-gray-600">Manage customer products and services</p>
            </div>
          </div>
          {canAddProduct && (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className=" text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>

        {/* Products Grid */}
        <div className="space-y-4">
          {isCustomerLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-gray-600">Loading customer products...</p>
              </div>
            </div>
          ) : customerProducts.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products added</h3>
                <p className="text-gray-600 text-center mb-4">
                  No products have been added for this customer yet.
                </p>
                {canAddProduct && (
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Product
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {customerProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {product.product_name || product.product}
                          </CardTitle>
                          <Badge variant="secondary" className="mt-1">
                            {product.product_type || product.type || 'Product'}
                          </Badge>
                        </div>
                      </div>
                      {canAddProduct && (
                        <div className="flex items-center space-x-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(product)}
                                className="text-blue-600 border-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit product</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteModal(product)}
                                className="text-red-600 border-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete product</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Product Details */}
                    <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-lg font-bold text-green-600">${product.price}</span>
                        </div>
                        <div className="text-xs text-gray-600">Price</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <Hash className="h-4 w-4 text-blue-600" />
                          <span className="text-lg font-bold text-blue-600">{product.quantity}</span>
                        </div>
                        <div className="text-xs text-gray-600">Quantity</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <Calculator className="h-4 w-4 text-purple-600" />
                          <span className="text-lg font-bold text-purple-600">
                            ${(product.price * product.quantity).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">Total</div>
                      </div>
                    </div>

                    {/* Contacts Section */}
                    {product.contact && product.contact.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <User className="h-4 w-4 text-gray-600" />
                          <h4 className="text-sm font-medium text-gray-700">Contacts</h4>
                        </div>
                        <div className="space-y-2">
                          {product.contact.map((contact: any) => (
                            <div 
                              key={contact.id} 
                              className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow duration-200"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-medium text-sm">
                                    {contact.poc_name?.charAt(0)?.toUpperCase() || 'C'}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">{contact.poc_name}</div>
                                  <div className="text-xs text-gray-500">{contact.poc_email}</div>
                                </div>
                              </div>
                              {canAddProduct && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveContact(product.id, contact.id)}
                                      disabled={isSubmitting}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Remove contact</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add Product Dialog */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Add Product for Customer</span>
              </DialogTitle>
            </DialogHeader>

            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(handleAddCustomerProduct)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="product_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        handleProductChange(value);
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name || product.product}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Enter quantity"
                          {...field}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(value);
                            handleQuantityChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Enter price"
                          {...field}
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value));
                            handlePriceChange();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="contacts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contacts</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contacts (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id.toString()}>
                              {contact.poc_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      addForm.reset();
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Edit className="h-5 w-5" />
                <span>Edit Customer Product</span>
              </DialogTitle>
            </DialogHeader>

            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdateCustomerProduct)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Enter quantity"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Enter price"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="contacts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contacts</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contacts (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id.toString()}>
                              {contact.poc_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingProduct(null);
                      editForm.reset();
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Update Product
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                <span>Delete Product</span>
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Are you sure you want to delete the product{' '}
                  <strong>"{deletingProduct?.product_name || deletingProduct?.product}"</strong>?
                </p>
                <p className="text-sm text-gray-500">
                  This action cannot be undone. The product will be permanently removed from this customer.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3">
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCustomerProduct}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Product
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default ProductAndService;